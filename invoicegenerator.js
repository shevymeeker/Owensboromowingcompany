// src/InvoiceGenerator.js

// ... (imports and color definitions are the same) ...

const InvoiceGenerator = ({ invoice, client, business }) => {

  const generatePdf = () => {
    const doc = new jsPDF();
    
    // --- Header ---
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary); // Green
    doc.text(business.name, 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.textLight);

    let currentY = 27; // This is our starting Y position
    
    doc.text(business.address, 15, currentY);
    
    currentY += 5; // Move down 5 units
    doc.text(business.phone, 15, currentY);

    // Conditionally add email, website, and EIN
    // This way, if a value is blank, it won't be printed.
    if (business.email) {
      currentY += 5;
      doc.text(business.email, 15, currentY);
    }
    
    if (business.website) {
      currentY += 5;
      doc.text(business.website, 15, currentY);
    }
    
    if (business.ein) {
      currentY += 5;
      doc.text(business.ein, 15, currentY);
    }

    // --- Invoice Title ---
    doc.setFontSize(30);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.black);
    doc.text('INVOICE', 195, 20, { align: 'right' });

    // --- Bill To Section ---
    // We base the Y position of this section on the header's height
    const sectionTopY = currentY + 10; 
    
    doc.setDrawColor(COLORS.grey); // Light grey line
    doc.line(15, sectionTopY, 195, sectionTopY); // x1, y1, x2, y2

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.highlight); // Orange Highlight
    doc.text('BILL TO:', 15, sectionTopY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.text);
    doc.text(client.name, 15, sectionTopY + 17);
    doc.text(client.address, 15, sectionTopY + 23);
    doc.text(client.phone, 15, sectionTopY + 29);

    // --- Invoice Info (Number, Date) ---
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.text);
    doc.text('Invoice #:', 130, sectionTopY + 10);
    doc.text('Date:', 130, sectionTopY + 17);

    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoiceId, 155, sectionTopY + 10); 
    doc.text(new Date().toLocaleDateString(), 155, sectionTopY + 17);

    const tableStartY = sectionTopY + 42; // Dynamic Y for table
    doc.line(15, tableStartY - 7, 195, tableStartY - 7);

    // --- Invoice Table ---
    doc.autoTable({
      startY: tableStartY, // Use the new dynamic start Y
      // ... (rest of the table code is exactly the same)
    });
    
    // ... (rest of the file is the same) ...
  };
  
  // ... (rest of the component is the same) ...
};

export default InvoiceGenerator;
