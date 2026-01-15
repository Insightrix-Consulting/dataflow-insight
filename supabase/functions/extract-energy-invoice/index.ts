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
  // If it's already just a path, return it
  if (!url.startsWith('http')) {
    return url;
  }
  // Match URLs like: https://xxx.supabase.co/storage/v1/object/public/documents/filename.pdf
  const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/documents\/(.+?)(?:\?|$)/);
  if (match) {
    return match[1];
  }
  // Fallback: try to get the last part after /documents/
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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

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
      
      // Update document status to failed
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
    
    console.log("Converted to base64, sending to Vision AI...");

    // Use Gemini Vision to extract data from the PDF
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
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

Extract the data now.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_invoice_data",
              description: "Extract structured data from an energy invoice",
              parameters: {
                type: "object",
                properties: {
                  invoice_date: { 
                    type: "string", 
                    description: "Invoice date in YYYY-MM-DD format" 
                  },
                  billing_period_start: { 
                    type: "string", 
                    description: "Billing period start date in YYYY-MM-DD format" 
                  },
                  billing_period_end: { 
                    type: "string", 
                    description: "Billing period end date in YYYY-MM-DD format" 
                  },
                  reading_type: { 
                    type: "string", 
                    enum: ["Actual", "Estimated", "Customer Read", "Unknown"],
                    description: "Type of meter reading" 
                  },
                  kwh_used: { 
                    type: "number", 
                    description: "Total kWh consumed during billing period" 
                  },
                  supplier_name: { 
                    type: "string", 
                    description: "Name of the energy supplier" 
                  },
                  confidence_invoice_date: { 
                    type: "number", 
                    description: "Confidence score 0-100 for invoice date extraction" 
                  },
                  confidence_reading_type: { 
                    type: "number", 
                    description: "Confidence score 0-100 for reading type extraction" 
                  },
                  confidence_kwh: { 
                    type: "number", 
                    description: "Confidence score 0-100 for kWh extraction" 
                  }
                },
                required: [
                  "invoice_date", 
                  "billing_period_start", 
                  "billing_period_end", 
                  "reading_type", 
                  "kwh_used", 
                  "supplier_name",
                  "confidence_invoice_date",
                  "confidence_reading_type",
                  "confidence_kwh"
                ],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_invoice_data" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        await supabase
          .from("documents")
          .update({ status: "failed" })
          .eq("id", document_id);
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (aiResponse.status === 402) {
        await supabase
          .from("documents")
          .update({ status: "failed" })
          .eq("id", document_id);
        throw new Error("AI credits exhausted. Please add credits to continue.");
      }
      throw new Error(`AI extraction failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI Response received");
    
    // Extract the tool call result
    let extraction: ExtractionResult;
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall && toolCall.function?.arguments) {
        extraction = JSON.parse(toolCall.function.arguments);
        console.log("Extracted data via tool call:", extraction);
      } else {
        // Fallback: try to parse content if no tool call
        const content = aiData.choices?.[0]?.message?.content || "";
        const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        extraction = JSON.parse(cleanContent);
        console.log("Extracted data from content:", extraction);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiData);
      
      // Set document to failed state
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
