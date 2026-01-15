import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractionResult {
  invoice_date: string | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  reading_type: "Actual" | "Estimated" | "Customer Read" | "Unknown";
  kwh_used: number | null;
  supplier_name: string | null;
  confidence_invoice_date: number;
  confidence_reading_type: number;
  confidence_kwh: number;
}

// Extract file path from URL if needed
function extractFilePath(url: string): string {
  if (!url.startsWith('http')) {
    return url;
  }
  const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/documents\/(.+?)(?:\?|$)/);
  if (match) {
    return match[1];
  }
  const parts = url.split('/documents/');
  if (parts.length > 1) {
    return parts[1].split('?')[0];
  }
  return url;
}

// Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { document_id } = await req.json();

    if (!document_id) {
      return new Response(
        JSON.stringify({ error: "document_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update document status to processing
    await supabase
      .from("documents")
      .update({ status: "processing" })
      .eq("id", document_id);

    // Fetch the document
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", document_id)
      .single();

    if (docError || !doc) {
      throw new Error("Document not found");
    }

    console.log("Processing document:", doc.filename, "File URL:", doc.file_url);

    // Download the PDF from storage
    const filePath = extractFilePath(doc.file_url);
    console.log("Extracted file path:", filePath);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(filePath);

    if (downloadError || !fileData) {
      console.error("Failed to download file:", downloadError);
      await supabase
        .from("documents")
        .update({ status: "failed" })
        .eq("id", document_id);
      throw new Error(`Failed to download document: ${downloadError?.message || 'Unknown error'}`);
    }

    console.log("Downloaded file, size:", fileData.size, "bytes");

    // Convert PDF to base64 for Vision API
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Data = arrayBufferToBase64(arrayBuffer);
    const mimeType = doc.filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png';
    
    console.log("Converted to base64, sending to Gemini Vision AI...");

    // Use Gemini Vision to extract data from the PDF
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an expert energy invoice data extraction system. Analyze this energy invoice document and extract the following information accurately.

IMPORTANT INSTRUCTIONS:
1. Look carefully at all pages of the document
2. For dates, convert to YYYY-MM-DD format
3. For kWh, extract the total consumption figure (not daily or partial readings)
4. For reading type, look for keywords like:
   - "Actual" or "A" = Actual reading
   - "Estimated" or "E" = Estimated reading
   - "Customer" or "C" = Customer Read
   - If unclear, use "Unknown"
5. For supplier name, look at the letterhead, logo, or company name
6. Provide confidence scores (0-100) based on how clearly visible/readable each value is:
   - 90-100: Value is clearly visible and unambiguous
   - 75-89: Value is visible but formatting is non-standard
   - 60-74: Value is partially visible or inferred
   - Below 60: Value is guessed or not found

Return a JSON object with these exact fields:
{
  "invoice_date": "YYYY-MM-DD or null",
  "billing_period_start": "YYYY-MM-DD or null",
  "billing_period_end": "YYYY-MM-DD or null",
  "reading_type": "Actual" or "Estimated" or "Customer Read" or "Unknown",
  "kwh_used": number or null,
  "supplier_name": "string",
  "confidence_invoice_date": number (0-100),
  "confidence_reading_type": number (0-100),
  "confidence_kwh": number (0-100)
}

Return ONLY the JSON object, no explanation or markdown.`
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024
        }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Gemini API error:", aiResponse.status, errorText);
      
      await supabase
        .from("documents")
        .update({ status: "failed" })
        .eq("id", document_id);
      
      if (aiResponse.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      throw new Error(`AI extraction failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("Gemini Response received");
    
    // Extract the response content
    let extraction: ExtractionResult;
    try {
      const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      console.log("Raw AI response:", content);
      
      // Clean up the response - remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      extraction = JSON.parse(cleanContent);
      console.log("Parsed extraction:", extraction);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiData);
      
      await supabase
        .from("documents")
        .update({ status: "failed" })
        .eq("id", document_id);
      
      throw new Error("Failed to parse extraction results");
    }

    // Validate and sanitize extraction data
    extraction = {
      invoice_date: extraction.invoice_date || null,
      billing_period_start: extraction.billing_period_start || null,
      billing_period_end: extraction.billing_period_end || null,
      reading_type: extraction.reading_type || "Unknown",
      kwh_used: typeof extraction.kwh_used === 'number' ? extraction.kwh_used : null,
      supplier_name: extraction.supplier_name || "Unknown Supplier",
      confidence_invoice_date: Math.min(100, Math.max(0, extraction.confidence_invoice_date || 50)),
      confidence_reading_type: Math.min(100, Math.max(0, extraction.confidence_reading_type || 50)),
      confidence_kwh: Math.min(100, Math.max(0, extraction.confidence_kwh || 50)),
    };

    // Calculate overall confidence
    const overallConfidence = Math.round(
      (extraction.confidence_invoice_date + 
       extraction.confidence_reading_type + 
       extraction.confidence_kwh) / 3
    );

    // Determine if needs review (any confidence < 85)
    const needsReview = 
      extraction.confidence_invoice_date < 85 ||
      extraction.confidence_reading_type < 85 ||
      extraction.confidence_kwh < 85;

    console.log("Overall confidence:", overallConfidence, "Needs review:", needsReview);

    // Update document with supplier name and confidence
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        supplier_name: extraction.supplier_name,
        overall_confidence: overallConfidence,
        status: needsReview ? "needs_review" : "approved",
      })
      .eq("id", document_id);

    if (updateError) {
      console.error("Failed to update document:", updateError);
    }

    // Create energy invoice record
    const { error: invoiceError } = await supabase
      .from("energy_invoices")
      .insert({
        document_id: document_id,
        invoice_date: extraction.invoice_date,
        billing_period_start: extraction.billing_period_start,
        billing_period_end: extraction.billing_period_end,
        reading_type: extraction.reading_type,
        kwh_used: extraction.kwh_used,
        confidence_invoice_date: extraction.confidence_invoice_date,
        confidence_reading_type: extraction.confidence_reading_type,
        confidence_kwh: extraction.confidence_kwh,
      });

    if (invoiceError) {
      console.error("Failed to create invoice:", invoiceError);
      throw invoiceError;
    }

    console.log("Extraction complete:", {
      document_id,
      supplier: extraction.supplier_name,
      kwh: extraction.kwh_used,
      overall_confidence: overallConfidence,
      needs_review: needsReview,
    });

    return new Response(
      JSON.stringify({
        success: true,
        document_id,
        extraction,
        overall_confidence: overallConfidence,
        needs_review: needsReview,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Extraction error:", error);
    const errorMessage = error instanceof Error ? error.message : "Extraction failed";

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
