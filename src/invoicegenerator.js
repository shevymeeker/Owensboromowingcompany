import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Define your brand colors
const COLORS = {
  primary: '#2A9D8F',   // A nice green
  secondary: '#E9C46A', // (Using this as an example, you mentioned orange)
  highlight: '#F4A261', // Orange for highlights
  text: '#264653',
  textLight: '#555555',
  bgLight: '#F7F7F7',   // Light grey background
  black: '#000000',
  grey: '#808080',
};

/**
 * A component that generates an invoice PDF.
 * This component doesn't render anything itself,
 * it just provides a function to call.
 * * @param {object} props
 * @param {object} props.invoice - The invoice data
 * @param {object} props.client - The client data
 * @param {object} props.business - Your business info
 */
const InvoiceGenerator = ({ invoice, client, business }) => {

  const generatePdf = () => {
    // 1. Create a new PDF document
    const doc = new jsPDF();

    // --- Header ---
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary); // Green
    doc.text(business.name, 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.textLight);
    doc.text(business.address, 15, 27);
    doc.text(business.phone, 15, 32);
    doc.text(business.email, 15, 37);

    // --- Invoice Title ---
    doc.setFontSize(30);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.black);
    doc.text('INVOICE', 195, 20, { align: 'right' });

    // --- Bill To Section ---
    doc.setDrawColor(COLORS.grey); // Light grey line
    doc.line(15, 45, 195, 45); // x1, y1, x2, y2

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.highlight); // Orange Highlight
    doc.text('BILL TO:', 15, 55);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.text);
    doc.text(client.name, 15, 62);
    doc.text(client.address, 15, 68);
    doc.text(client.phone, 15, 74);

    // --- Invoice Info (Number, Date) ---
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.text);
    doc.text('Invoice #:', 130, 55);
    doc.text('Date:', 130, 62);

    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoiceId, 155, 55); // Use invoice.invoiceId
    doc.text(new Date().toLocaleDateString(), 155, 62); // Format date

    doc.line(15, 85, 195, 85);

    // --- Invoice Table ---
    // Prepare table data
    const tableData = invoice.items.map(item => [
      item.description,
      item.quantity,
      `$${Number(item.price).toFixed(2)}`,
      `$${(item.quantity * item.price).toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 92,
      head: [['Description', 'Quantity', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [42, 157, 143], // Header background (Primary Green)
        textColor: [255, 255, 255], // Header text (White)
        fontStyle: 'bold',
      },
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [247, 247, 247] // Light grey for alternate rows
      }
    });

    // --- Total Section ---
    const finalY = doc.autoTable.previous.finalY;
    const total = invoice.items
      .reduce((sum, item) => sum + item.quantity * item.price, 0)
      .toFixed(2);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.highlight); // Orange Highlight
    doc.text('TOTAL:', 130, finalY + 15);
    doc.text(`$${total}`, 195, finalY + 15, { align: 'right' });

    // --- Footer / Thank You ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(COLORS.grey);
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });

    // --- Save the PDF ---
    // This will open it in a new tab or prompt a download
    doc.save(`Invoice-${client.name}-${invoice.invoiceId}.pdf`);
  };

  // This component doesn't need to render HTML,
  // but we can return a button to trigger the generation for testing.
  return (
    <button 
      onClick={generatePdf}
      style={{
        backgroundColor: COLORS.primary, // Green
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px'
      }}
    >
      Generate PDF
    </button>
  );
};

export default InvoiceGenerator;
