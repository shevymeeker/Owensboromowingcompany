// In your App.js
import React, { useState, useEffect } from 'react';
import InvoiceGenerator from './InvoiceGenerator';
import { BUSINESS_INFO } from './config'; // <-- 1. IMPORT YOUR NEW CONFIG

// --- This is DUMMY DATA for the example ---
// (We removed the DUMMY_BUSINESS object)
const DUMMY_CLIENT = { /* ... (same as before) ... */ };
const DUMMY_INVOICE = { /* ... (same as before) ... */ };
// --- End of DUMMY DATA ---


function App() {
  // In a real app, this data would come from Firebase
  const [client, setClient] = useState(DUMMY_CLIENT);
  const [invoice, setInvoice] = useState(DUMMY_INVOICE);
  
  // 2. We removed the 'business' state, since it's now a constant

  return (
    <div style={{ padding: '20px' }}>
      <h1>Invoice App</h1>
      <p>This button will generate the PDF for the sample client.</p>
      
      <InvoiceGenerator 
        client={client} 
        invoice={invoice} 
        business={BUSINESS_INFO} // <-- 3. PASS THE IMPORTED INFO HERE
      />
    </div>
  );
}

export default App;
