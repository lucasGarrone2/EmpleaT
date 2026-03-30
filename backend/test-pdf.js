import { PDFParse as pdfParse } from 'pdf-parse';

async function test() {
    try {
        console.log("PDFParse type:", typeof pdfParse);
        // Let's test if it takes a buffer
        const dummyBuffer = Buffer.from("%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n");
        console.log("Calling pdfParse...");
        const result = await pdfParse(dummyBuffer);
        console.log("Success:", !!result);
    } catch(err) {
        console.error("Test Error:", err);
    }
}
test();
