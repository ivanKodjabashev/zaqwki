export const printTableOnly = (tableId) => {
  const tableElement = document.getElementById(tableId);

  if (!tableElement) {
    return;
  }

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="bg">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Print Table</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 24px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th,
        td {
          padding: 12px;
          text-align: left;
          border: 1px solid #d7dee7;
        }
        th {
          background: #f1f5f9;
        }
        .done-btn,
        .row-delete-btn,
        .row-edit-btn,
        .row-save-btn,
        .row-cancel-btn,
        .row-delete-placeholder,
        .edit-input {
          display: none !important;
        }
      </style>
    </head>
    <body>
      ${tableElement.outerHTML}
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
};
