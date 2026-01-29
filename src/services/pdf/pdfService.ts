import pdfMake from 'pdfmake/build/pdfmake';
import { vfs as pdfMakeVfs } from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import { Purchase, DeliveryNote, Invoice, DocumentLine, CashEntry, Sale, StockMovement, Client, Supplier, Quotation, BankTransfer, AppSettings } from '@/core/types';
import { JournalEntry } from '@/features/accounting/types';
import { format } from 'date-fns';
import { storageService } from '../storage/storageService';

// Initialize pdfMake fonts
(pdfMake as unknown as { vfs: Record<string, string> }).vfs = pdfMakeVfs;

class PdfService {
  /**
   * Generates a PDF for a Purchase Order (Bon d'Achat)
   */
  generatePurchasePDF(purchase: Purchase) {
    const settings = storageService.loadCollection('settings') as unknown as AppSettings;
    const company = settings?.company || { name: 'Ma Société' };

    const docDefinition: TDocumentDefinitions = {
      content: this.getPurchaseOrderContent(purchase, company),
      styles: {
        companyName: { fontSize: 18, bold: true, color: '#111827' },
        companyInfo: { fontSize: 10, color: '#4b5563', lineHeight: 1.2 },
        documentTitle: { fontSize: 24, bold: true, color: '#2563eb' }, // Blue title
        documentNumber: { fontSize: 12, bold: true, color: '#6b7280' },
        documentDate: { fontSize: 10, color: '#6b7280' },
        boxTitle: { fontSize: 10, bold: true, color: '#6b7280', margin: [0, 0, 0, 5] },
        boxContent: { fontSize: 10, color: '#111827', lineHeight: 1.4 },
        tableHeader: { fontSize: 10, bold: true, color: 'white', fillColor: '#1f2937', margin: [0, 5, 0, 5] },
        totalLabel: { fontSize: 10, bold: true, alignment: 'right', margin: [0, 2, 0, 2] },
        totalValue: { fontSize: 10, alignment: 'right', margin: [0, 2, 0, 2] },
        totalLabelBold: { fontSize: 12, bold: true, alignment: 'right', margin: [0, 5, 0, 5], color: '#2563eb' },
        totalValueBold: { fontSize: 12, bold: true, alignment: 'right', margin: [0, 5, 0, 5], color: '#2563eb' },
        label: { fontSize: 10, bold: true, color: '#374151' },
        notes: { fontSize: 10, color: '#4b5563', italic: true },
        footerText: { fontSize: 8, color: '#9ca3af', alignment: 'center' }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };

    pdfMake.createPdf(docDefinition).download(`BA_${purchase.number}.pdf`);
  }

  generateClientStatementPDF(client: Client, transactions: { date: string; type: string; reference?: string; amount: number; balance: number; }[], currentDebt: number) {
    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'ETAT DE COMPTE CLIENT', style: 'header' },
        {
          columns: [
            {
              width: '*',
              text: [
                { text: 'Client:\n', style: 'label' },
                { text: client.name }
              ]
            },
            {
              width: '*',
              text: [
                { text: 'ICE:\n', style: 'label' },
                { text: client.ice || 'N/A' }
              ],
              alignment: 'right'
            }
          ]
        },
        { text: 'Transactions', style: 'sectionHeader', margin: [0, 20, 0, 10] },
        {
          table: {
            headerRows: 1,
            widths: [80, '*', '*', 80, 80],
            body: [
              [
                { text: 'Date', style: 'tableHeader' },
                { text: 'Type', style: 'tableHeader' },
                { text: 'Réf.', style: 'tableHeader' },
                { text: 'Montant', style: 'tableHeader', alignment: 'right' },
                { text: 'Solde', style: 'tableHeader', alignment: 'right' }
              ],
              ...transactions.map(tx => [
                format(new Date(tx.date), 'dd/MM/yyyy'),
                tx.type,
                tx.reference || '',
                { text: tx.amount.toFixed(2), alignment: 'right' },
                { text: tx.balance.toFixed(2), alignment: 'right' }
              ])
            ]
          },
          layout: 'lightHorizontalLines'
        },
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 250,
              margin: [0, 20, 0, 0],
              table: {
                widths: ['*', '*'],
                body: [
                  [{ text: 'Solde actuel', bold: true }, { text: `${currentDebt.toFixed(2)} MAD`, alignment: 'right', bold: true }]
                ]
              }
            }
          ]
        }
      ],
      styles: {
        header: { fontSize: 22, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
        sectionHeader: { fontSize: 14, bold: true, border: [0, 0, 0, 1], margin: [0, 10, 0, 5] },
        label: { bold: true, fontSize: 10 },
        tableHeader: { bold: true, fontSize: 11, fillColor: '#f3f4f6' }
      }
    };
    const fileName = `CLIENT_${client.name.replace(/\s+/g, '_')}_STATEMENT.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
  }

  generateSupplierStatementPDF(supplier: Supplier, transactions: { date: string; type: string; reference?: string; amount: number; balance: number; }[], currentBalance: number) {
    const settings = storageService.loadCollection('settings') as unknown as AppSettings;
    const company = settings?.company || { name: 'Ma Société' };

    const docDefinition: TDocumentDefinitions = {
      content: [
        // Header with Company Info
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: company.name.toUpperCase(), style: 'companyName' },
                { text: company.address || '', style: 'companyInfo' },
                { text: `${company.city || ''}`, style: 'companyInfo' },
                { text: `Tél: ${company.phone || ''}`, style: 'companyInfo' },
                { text: `Email: ${company.email || ''}`, style: 'companyInfo' },
              ]
            },
            {
              width: 'auto',
              stack: [
                { text: 'ETAT DE COMPTE', style: 'documentTitle', alignment: 'right' },
                { text: `Date: ${format(new Date(), 'dd/MM/yyyy')}`, style: 'documentDate', alignment: 'right' },
              ]
            }
          ],
          margin: [0, 0, 0, 30]
        },

        // Supplier Details
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'FOURNISSEUR:', style: 'boxTitle' },
                { text: supplier.name, style: 'boxContent', bold: true, fontSize: 12 },
                { text: supplier.address || '', style: 'boxContent' },
                { text: supplier.city || '', style: 'boxContent' },
                { text: supplier.phone ? `Tél: ${supplier.phone}` : '', style: 'boxContent' },
              ]
            },
            {
              width: '*',
              stack: [
                { text: 'INFORMATIONS LEGALES:', style: 'boxTitle', alignment: 'right' },
                { 
                  stack: [
                    { text: `ICE: ${supplier.ice || 'N/A'}`, alignment: 'right' },
                    { text: `RC: ${supplier.rc || 'N/A'}`, alignment: 'right' },
                    { text: `IF: ${supplier.if || 'N/A'}`, alignment: 'right' },
                    { text: `CNSS: ${supplier.cnss || 'N/A'}`, alignment: 'right' },
                  ],
                  style: 'boxContent'
                }
              ]
            }
          ],
          margin: [0, 0, 0, 20]
        },

        { text: 'Historique des transactions', style: 'sectionHeader', margin: [0, 10, 0, 10] },
        
        {
          table: {
            headerRows: 1,
            widths: [80, '*', '*', 80, 80],
            body: [
              [
                { text: 'Date', style: 'tableHeader' },
                { text: 'Type', style: 'tableHeader' },
                { text: 'Réf.', style: 'tableHeader' },
                { text: 'Montant', style: 'tableHeader', alignment: 'right' },
                { text: 'Solde', style: 'tableHeader', alignment: 'right' }
              ],
              ...(transactions.length > 0 ? transactions.map(tx => [
                format(new Date(tx.date), 'dd/MM/yyyy'),
                tx.type,
                tx.reference || '-',
                { text: tx.amount.toFixed(2), alignment: 'right', color: tx.amount < 0 ? '#16a34a' : '#dc2626' },
                { text: tx.balance.toFixed(2), alignment: 'right', bold: true }
              ]) : [[
                { text: 'Aucune transaction trouvée pour cette période', colSpan: 5, alignment: 'center', italic: true, color: '#6b7280', margin: [0, 10, 0, 10] },
                {}, {}, {}, {}
              ]])
            ]
          },
          layout: 'lightHorizontalLines'
        },
        
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 250,
              margin: [0, 20, 0, 0],
              table: {
                widths: ['*', '*'],
                body: [
                  [
                    { text: 'Solde actuel', style: 'totalLabelBold' }, 
                    { text: `${currentBalance.toFixed(2)} MAD`, style: 'totalValueBold' }
                  ]
                ]
              },
              layout: 'noBorders'
            }
          ]
        },

        // Footer
        {
          text: 'Ce document est généré automatiquement par le système.',
          style: 'footerText',
          margin: [0, 30, 0, 0]
        }
      ],
      styles: {
        companyName: { fontSize: 16, bold: true, color: '#111827', margin: [0, 0, 0, 5] },
        companyInfo: { fontSize: 9, color: '#4b5563', lineHeight: 1.2 },
        documentTitle: { fontSize: 20, bold: true, color: '#2563eb', margin: [0, 0, 0, 5] },
        documentDate: { fontSize: 10, color: '#6b7280' },
        boxTitle: { fontSize: 9, bold: true, color: '#6b7280', margin: [0, 0, 0, 5] },
        boxContent: { fontSize: 10, color: '#111827', lineHeight: 1.3 },
        sectionHeader: { fontSize: 12, bold: true, color: '#111827', margin: [0, 10, 0, 10] },
        tableHeader: { fontSize: 9, bold: true, color: 'white', fillColor: '#1f2937', margin: [4, 4, 4, 4] },
        totalLabelBold: { fontSize: 11, bold: true, alignment: 'right', margin: [0, 5, 0, 5], color: '#1f2937' },
        totalValueBold: { fontSize: 11, bold: true, alignment: 'right', margin: [0, 5, 0, 5], color: '#2563eb' },
        footerText: { fontSize: 8, color: '#9ca3af', alignment: 'center', italic: true }
      },
      defaultStyle: {
        fontSize: 9
      }
    };
    const fileName = `FOURNISSEUR_${supplier.name.replace(/\s+/g, '_')}_STATEMENT.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
  }

  /**
   * Generates a PDF for a Delivery Note (Bon de Livraison)
   */
  generateDeliveryPDF(delivery: DeliveryNote) {
    const settings = storageService.loadCollection('settings') as unknown as AppSettings;
    const company = settings?.company || { name: 'Ma Société' };

    const docDefinition: TDocumentDefinitions = {
      content: this.getDeliveryOrderContent(delivery, company),
      styles: {
        companyName: { fontSize: 18, bold: true, color: '#111827' },
        companyInfo: { fontSize: 10, color: '#4b5563', lineHeight: 1.2 },
        documentTitle: { fontSize: 24, bold: true, color: '#2563eb' },
        documentNumber: { fontSize: 12, bold: true, color: '#6b7280' },
        documentDate: { fontSize: 10, color: '#6b7280' },
        boxTitle: { fontSize: 10, bold: true, color: '#6b7280', margin: [0, 0, 0, 5] },
        boxContent: { fontSize: 10, color: '#111827', lineHeight: 1.4 },
        tableHeader: { fontSize: 10, bold: true, color: 'white', fillColor: '#1f2937', margin: [0, 5, 0, 5] },
        totalLabel: { fontSize: 10, bold: true, alignment: 'right', margin: [0, 2, 0, 2] },
        totalValue: { fontSize: 10, alignment: 'right', margin: [0, 2, 0, 2] },
        totalLabelBold: { fontSize: 12, bold: true, alignment: 'right', margin: [0, 5, 0, 5], color: '#2563eb' },
        totalValueBold: { fontSize: 12, bold: true, alignment: 'right', margin: [0, 5, 0, 5], color: '#2563eb' },
        label: { fontSize: 10, bold: true, color: '#374151' },
        notes: { fontSize: 10, color: '#4b5563', italic: true },
        footerText: { fontSize: 8, color: '#9ca3af', alignment: 'center' }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };

    pdfMake.createPdf(docDefinition).download(`BL_${delivery.number}.pdf`);
  }

  /**
   * Generates a PDF for a Cash Entry (Recette/Dépense)
   */
  generateRecettePDF(entry: CashEntry) {
    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: entry.type === 'ENTREE' ? 'REÇU D\'ENTRÉE CAISSE' : 'BON DE SORTIE CAISSE', style: 'header' },
        { text: `Date: ${format(new Date(entry.dateTime), 'dd/MM/yyyy HH:mm')}`, margin: [0, 0, 0, 20] },
        
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: 'Catégorie:', style: 'label' },
                { text: entry.category }
              ],
              [
                { text: 'Mode de paiement:', style: 'label' },
                { text: entry.method.toUpperCase() }
              ],
              [
                { text: 'Montant:', style: 'label' },
                { text: `${entry.amount.toFixed(2)} MAD`, bold: true, fontSize: 14 }
              ]
            ]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 20]
        },
        
        { text: 'Description:', style: 'label', margin: [0, 10, 0, 5] },
        { text: entry.description || 'N/A', margin: [0, 0, 0, 15] },
        
        { text: 'Notes:', style: 'label', margin: [0, 10, 0, 5] },
        { text: entry.notes || 'Aucune note.', fontStyle: 'italic' },

        {
          columns: [
            { width: '*', text: '' },
            {
              width: 150,
              margin: [0, 50, 0, 0],
              stack: [
                { text: 'Signature', alignment: 'center', decoration: 'underline' },
                { text: '\n\n\n\n' }
              ]
            }
          ]
        }
      ],
      styles: {
        header: { fontSize: 20, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
        label: { bold: true, fontSize: 11 },
      }
    };

    pdfMake.createPdf(docDefinition).download(`RECETTE_${entry.id.slice(0, 8)}.pdf`);
  }

  generateBankTransfersPDF(transfers: BankTransfer[]) {
    const rows =
      transfers.length === 0
        ? [
            [
              { text: 'Aucun transfert', colSpan: 5, alignment: 'center' },
              {},
              {},
              {},
              {},
            ],
          ]
        : transfers.map((transfer) => [
            format(new Date(transfer.dateTime), 'dd/MM/yyyy HH:mm'),
            transfer.type === 'ESPECE_TO_BANQUE'
              ? 'Espèces → Banque'
              : transfer.type === 'CHEQUE_TO_BANQUE'
              ? 'Chèque → Banque'
              : 'Banque → Espèces',
            `${transfer.amount.toFixed(2)} MAD`,
            `${transfer.fromMethod.toUpperCase()} → ${transfer.toMethod.toUpperCase()}`,
            transfer.notes || '',
          ]);

    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'HISTORIQUE DES TRANSFERTS BANCAIRES', style: 'header' },
        {
          table: {
            headerRows: 1,
            widths: [80, '*', 80, '*', '*'],
            body: [
              [
                { text: 'Date', style: 'tableHeader' },
                { text: 'Type', style: 'tableHeader' },
                { text: 'Montant', style: 'tableHeader', alignment: 'right' },
                { text: 'Méthode', style: 'tableHeader' },
                { text: 'Notes', style: 'tableHeader' },
              ],
              ...rows,
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 20, 0, 0],
        },
      ],
      styles: {
        header: { fontSize: 20, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
        tableHeader: { bold: true, fontSize: 11, fillColor: '#f3f4f6' },
      },
    };

    pdfMake.createPdf(docDefinition).download('TRANSFERTS_BANCAIRES.pdf');
  }

  /**
   * Generates a PDF for a Sale (Bon de Vente)
   */
  generateSalePDF(sale: Sale) {
    const settings = storageService.loadCollection('settings') as unknown as AppSettings;
    const company = settings?.company || { name: 'Ma Société' };

    const docDefinition: TDocumentDefinitions = {
      content: [
        // Header
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: (company.name || 'Ma Société').toUpperCase(), style: 'companyName' },
                { text: company.address || '', style: 'companyInfo' },
                { text: `${company.city || ''}`, style: 'companyInfo' },
                { text: `Tél: ${company.phone || ''}`, style: 'companyInfo' },
                { text: `Email: ${company.email || ''}`, style: 'companyInfo' },
              ]
            },
            {
              width: 'auto',
              stack: [
                { text: "BON DE VENTE", style: 'documentTitle', alignment: 'right' },
                { text: `N° ${sale.number}`, style: 'documentNumber', alignment: 'right' },
                { text: `Date: ${format(new Date(sale.date), 'dd/MM/yyyy')}`, style: 'documentDate', alignment: 'right' },
              ]
            }
          ],
          margin: [0, 0, 0, 30]
        },

        // Client & Details Info
        {
          columns: [
            {
              width: '48%',
              stack: [
                { text: 'CLIENT', style: 'boxTitle' },
                {
                  style: 'boxContent',
                  stack: [
                    { text: sale.clientName || 'Nom du client', bold: true },
                  ]
                }
              ],
              style: 'box'
            },
            {
              width: '4%',
              text: ''
            },
            {
              width: '48%',
              stack: [
                { text: 'DÉTAILS', style: 'boxTitle' },
                {
                  style: 'boxContent',
                  stack: [
                    { text: `Statut: ${(sale.status || 'draft').toUpperCase()}` },
                    { text: `Paiement: ${(sale.paymentStatus || 'unpaid').toUpperCase()} (${(sale.paymentMethod || 'cash').toUpperCase()})` },
                    sale.isCredit ? { text: 'VENTE A CRÉDIT', bold: true, color: '#dc2626' } : '',
                  ]
                }
              ],
              style: 'box'
            }
          ],
          margin: [0, 0, 0, 20]
        },

        // Line Items
        {
          table: {
            headerRows: 1,
            widths: ['*', 50, 70, 50, 40, 70],
            body: [
              [
                { text: 'Désignation', style: 'tableHeader' },
                { text: 'Qté', style: 'tableHeader', alignment: 'center' },
                { text: 'Prix U.', style: 'tableHeader', alignment: 'right' },
                { text: 'Rem.%', style: 'tableHeader', alignment: 'center' },
                { text: 'TVA', style: 'tableHeader', alignment: 'center' },
                { text: 'Total HT', style: 'tableHeader', alignment: 'right' }
              ],
              ...sale.lines.map(line => [
                line.productName || 'Produit',
                { text: line.quantity.toString(), alignment: 'center' },
                { text: line.unitPrice.toFixed(2), alignment: 'right' },
                { text: line.discount > 0 ? `${line.discount}%` : '-', alignment: 'center' },
                { text: `${line.tvaRate}%`, alignment: 'center' },
                { text: line.totalHT.toFixed(2), alignment: 'right' }
              ])
            ]
          },
          layout: {
            fillColor: function (rowIndex: number) {
              return (rowIndex === 0) ? '#1f2937' : (rowIndex % 2 === 0) ? '#f9fafb' : null;
            },
            hLineWidth: function (i: number, node: any) {
              return (i === 0 || i === node.table.body.length) ? 1 : 1;
            },
            vLineWidth: function (i: number, node: any) {
              return 0;
            },
            hLineColor: function (i: number, node: any) {
              return '#e5e7eb';
            }
          },
          margin: [0, 0, 0, 20]
        },

        // Totals
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 250,
              table: {
                widths: ['*', 100],
                body: [
                  [{ text: 'Total HT', style: 'totalLabel' }, { text: `${sale.totals.totalHT.toFixed(2)} MAD`, style: 'totalValue' }],
                  [{ text: 'Total TVA', style: 'totalLabel' }, { text: `${sale.totals.totalTVA.toFixed(2)} MAD`, style: 'totalValue' }],
                  [{ text: 'Total TTC', style: 'totalLabelBold' }, { text: `${sale.totals.totalTTC.toFixed(2)} MAD`, style: 'totalValueBold' }],
                  ...(sale.paidAmount !== undefined ? [
                    [{ text: 'Montant Payé', style: 'totalLabel' }, { text: `${sale.paidAmount.toFixed(2)} MAD`, style: 'totalValue' }],
                    [{ text: 'Reste à payer', style: 'totalLabelBold', color: '#dc2626' }, { text: `${(sale.totals.totalTTC - sale.paidAmount).toFixed(2)} MAD`, style: 'totalValueBold', color: '#dc2626' }]
                  ] : [])
                ]
              },
              layout: 'noBorders'
            }
          ]
        },

        // Footer / Notes
        {
          text: 'Notes:',
          style: 'label',
          margin: [0, 30, 0, 5]
        },
        {
          text: sale.notes || 'Aucune note.',
          style: 'notes'
        },

        // Signature
        {
          columns: [
            {
              width: '*',
              text: ''
            },
            {
              width: 200,
              stack: [
                { text: 'Signature', alignment: 'center', bold: true, margin: [0, 40, 0, 40] },
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] }
              ]
            }
          ]
        },
        
        // Footer text
        {
          text: `${company.name} - ${company.address || ''} - ICE: ${company.ice || 'N/A'}`,
          style: 'footerText',
          absolutePosition: { x: 40, y: 800 } // Bottom of page
        }
      ],
      styles: {
        companyName: { fontSize: 18, bold: true, color: '#111827' },
        companyInfo: { fontSize: 10, color: '#4b5563', lineHeight: 1.2 },
        documentTitle: { fontSize: 24, bold: true, color: '#2563eb' },
        documentNumber: { fontSize: 12, bold: true, color: '#6b7280' },
        documentDate: { fontSize: 10, color: '#6b7280' },
        boxTitle: { fontSize: 10, bold: true, color: '#6b7280', margin: [0, 0, 0, 5] },
        boxContent: { fontSize: 10, color: '#111827', lineHeight: 1.4 },
        tableHeader: { fontSize: 10, bold: true, color: 'white', fillColor: '#1f2937', margin: [0, 5, 0, 5] },
        totalLabel: { fontSize: 10, bold: true, alignment: 'right', margin: [0, 2, 0, 2] },
        totalValue: { fontSize: 10, alignment: 'right', margin: [0, 2, 0, 2] },
        totalLabelBold: { fontSize: 12, bold: true, alignment: 'right', margin: [0, 5, 0, 5], color: '#2563eb' },
        totalValueBold: { fontSize: 12, bold: true, alignment: 'right', margin: [0, 5, 0, 5], color: '#2563eb' },
        label: { fontSize: 10, bold: true, color: '#374151' },
        notes: { fontSize: 10, color: '#4b5563', italic: true },
        footerText: { fontSize: 8, color: '#9ca3af', alignment: 'center' }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };

    pdfMake.createPdf(docDefinition).download(`BV_${sale.number}.pdf`);
  }

  generateQuotationPDF(quotation: Quotation) {
    const settings = storageService.loadCollection('settings') as unknown as AppSettings;
    const company = settings?.company || { name: 'Ma Société' };

    const docDefinition: TDocumentDefinitions = {
      content: this.getQuotationContent(quotation, company),
      styles: {
        companyName: { fontSize: 18, bold: true, color: '#111827' },
        companyInfo: { fontSize: 10, color: '#4b5563', lineHeight: 1.2 },
        documentTitle: { fontSize: 24, bold: true, color: '#2563eb' },
        documentNumber: { fontSize: 12, bold: true, color: '#6b7280' },
        documentDate: { fontSize: 10, color: '#6b7280' },
        boxTitle: { fontSize: 10, bold: true, color: '#6b7280', margin: [0, 0, 0, 5] },
        boxContent: { fontSize: 10, color: '#111827', lineHeight: 1.4 },
        tableHeader: { fontSize: 10, bold: true, color: 'white', fillColor: '#1f2937', margin: [0, 5, 0, 5] },
        totalLabel: { fontSize: 10, bold: true, alignment: 'right', margin: [0, 2, 0, 2] },
        totalValue: { fontSize: 10, alignment: 'right', margin: [0, 2, 0, 2] },
        totalLabelBold: { fontSize: 12, bold: true, alignment: 'right', margin: [0, 5, 0, 5], color: '#2563eb' },
        totalValueBold: { fontSize: 12, bold: true, alignment: 'right', margin: [0, 5, 0, 5], color: '#2563eb' },
        label: { fontSize: 10, bold: true, color: '#374151' },
        notes: { fontSize: 10, color: '#4b5563', italic: true },
        footerText: { fontSize: 8, color: '#9ca3af', alignment: 'center' }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };
    pdfMake.createPdf(docDefinition).download(`DV_${quotation.number}.pdf`);
  }

  generateQuotationsPDF(quotations: Quotation[]) {
    const settings = storageService.loadCollection('settings') as unknown as AppSettings;
    const company = settings?.company || { name: 'Ma Société' };
    const content: Content[] = [];

    quotations.forEach((quotation, index) => {
      content.push(...this.getQuotationContent(quotation, company));
      
      if (index < quotations.length - 1) {
        content.push({ text: '', pageBreak: 'after' } as unknown as Content);
      }
    });

    const docDefinition: TDocumentDefinitions = {
      content,
      styles: {
        companyName: { fontSize: 18, bold: true, color: '#111827' },
        companyInfo: { fontSize: 10, color: '#4b5563', lineHeight: 1.2 },
        documentTitle: { fontSize: 24, bold: true, color: '#2563eb' },
        documentNumber: { fontSize: 12, bold: true, color: '#6b7280' },
        documentDate: { fontSize: 10, color: '#6b7280' },
        boxTitle: { fontSize: 10, bold: true, color: '#6b7280', margin: [0, 0, 0, 5] },
        boxContent: { fontSize: 10, color: '#111827', lineHeight: 1.4 },
        tableHeader: { fontSize: 10, bold: true, color: 'white', fillColor: '#1f2937', margin: [0, 5, 0, 5] },
        totalLabel: { fontSize: 10, bold: true, alignment: 'right', margin: [0, 2, 0, 2] },
        totalValue: { fontSize: 10, alignment: 'right', margin: [0, 2, 0, 2] },
        totalLabelBold: { fontSize: 12, bold: true, alignment: 'right', margin: [0, 5, 0, 5], color: '#2563eb' },
        totalValueBold: { fontSize: 12, bold: true, alignment: 'right', margin: [0, 5, 0, 5], color: '#2563eb' },
        label: { fontSize: 10, bold: true, color: '#374151' },
        notes: { fontSize: 10, color: '#4b5563', italic: true },
        footerText: { fontSize: 8, color: '#9ca3af', alignment: 'center' }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };
    const nameSuffix = quotations.length > 1 ? `DV_GROUP_${quotations.length}` : quotations[0].number;
    pdfMake.createPdf(docDefinition).download(`${nameSuffix}.pdf`);
  }
  generateInvoicePDF(invoice: Invoice) {
    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'FACTURE', style: 'header' },
        { text: `N°: ${invoice.number}`, style: 'subheader' },
        { text: `Date: ${format(new Date(invoice.date), 'dd/MM/yyyy')}`, margin: [0, 0, 0, 20] },
        {
          columns: [
            {
              width: '*',
              text: [
                { text: 'Client:\n', style: 'label' },
                { text: invoice.clientName || 'N/A' }
              ]
            },
            {
              width: '*',
              text: [
                { text: 'Paiement:\n', style: 'label' },
                { text: `Statut: ${invoice.paymentStatus.toUpperCase()}\nPayé: ${invoice.paidAmount.toFixed(2)} ${'MAD'}` }
              ],
              alignment: 'right'
            }
          ]
        },
        { text: 'Produits', style: 'sectionHeader', margin: [0, 20, 0, 10] },
        this.renderLinesTable(invoice.lines),
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 200,
              margin: [0, 20, 0, 0],
              table: {
                widths: ['*', '*'],
                body: [
                  ['Total HT', { text: `${invoice.totals.totalHT.toFixed(2)} MAD`, alignment: 'right' }],
                  ['Total TVA', { text: `${invoice.totals.totalTVA.toFixed(2)} MAD`, alignment: 'right' }],
                  [{ text: 'Total TTC', bold: true }, { text: `${invoice.totals.totalTTC.toFixed(2)} MAD`, alignment: 'right', bold: true }]
                ]
              }
            }
          ]
        },
        { text: 'Notes:', style: 'label', margin: [0, 30, 0, 5] },
        { text: invoice.notes || 'Aucune note.', fontStyle: 'italic' }
      ],
      styles: {
        header: { fontSize: 22, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
        subheader: { fontSize: 16, bold: true, alignment: 'center', margin: [0, 0, 0, 5] },
        sectionHeader: { fontSize: 14, bold: true, border: [0, 0, 0, 1], margin: [0, 10, 0, 5] },
        label: { bold: true, fontSize: 10 },
        tableHeader: { bold: true, fontSize: 11, fillColor: '#f3f4f6' }
      }
    };
    pdfMake.createPdf(docDefinition).download(`FAC_${invoice.number}.pdf`);
  }
  generateInvoicesPDF(invoices: Invoice[]) {
    const content: Content[] = [];
    invoices.forEach((invoice, index) => {
      content.push(
        { text: 'FACTURE', style: 'header' },
        { text: `N°: ${invoice.number}`, style: 'subheader' },
        { text: `Date: ${format(new Date(invoice.date), 'dd/MM/yyyy')}`, margin: [0, 0, 0, 20] },
        {
          columns: [
            {
              width: '*',
              text: [
                { text: 'Client:\n', style: 'label' },
                { text: invoice.clientName || 'N/A' }
              ]
            },
            {
              width: '*',
              text: [
                { text: 'Paiement:\n', style: 'label' },
                { text: `Statut: ${invoice.paymentStatus.toUpperCase()}\nPayé: ${invoice.paidAmount.toFixed(2)} ${'MAD'}` }
              ],
              alignment: 'right'
            }
          ]
        },
        { text: 'Produits', style: 'sectionHeader', margin: [0, 20, 0, 10] },
        this.renderLinesTable(invoice.lines),
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 200,
              margin: [0, 20, 0, 0],
              table: {
                widths: ['*', '*'],
                body: [
                  ['Total HT', { text: `${invoice.totals.totalHT.toFixed(2)} MAD`, alignment: 'right' }],
                  ['Total TVA', { text: `${invoice.totals.totalTVA.toFixed(2)} MAD`, alignment: 'right' }],
                  [{ text: 'Total TTC', bold: true }, { text: `${invoice.totals.totalTTC.toFixed(2)} MAD`, alignment: 'right', bold: true }]
                ]
              }
            }
          ]
        },
        { text: 'Notes:', style: 'label', margin: [0, 30, 0, 5] },
        { text: invoice.notes || 'Aucune note.', fontStyle: 'italic' },
      );
      if (index < invoices.length - 1) {
        content.push({ text: '', pageBreak: 'after' } as unknown as Content);
      }
    });
    const docDefinition: TDocumentDefinitions = {
      content,
      styles: {
        header: { fontSize: 22, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
        subheader: { fontSize: 16, bold: true, alignment: 'center', margin: [0, 0, 0, 5] },
        sectionHeader: { fontSize: 14, bold: true, border: [0, 0, 0, 1], margin: [0, 10, 0, 5] },
        label: { bold: true, fontSize: 10 },
        tableHeader: { bold: true, fontSize: 11, fillColor: '#f3f4f6' }
      }
    };
    const nameSuffix = invoices.length > 1 ? `GROUP_${invoices.length}` : invoices[0].number;
    pdfMake.createPdf(docDefinition).download(`FAC_${nameSuffix}.pdf`);
  }
  generateDeliveriesPDF(deliveries: DeliveryNote[]) {
    const settings = storageService.loadCollection('settings') as unknown as AppSettings;
    const company = settings?.company || { name: 'Ma Société' };
    const content: Content[] = [];

    deliveries.forEach((delivery, index) => {
      content.push(...this.getDeliveryOrderContent(delivery, company));
      
      if (index < deliveries.length - 1) {
        content.push({ text: '', pageBreak: 'after' } as unknown as Content);
      }
    });

    const docDefinition: TDocumentDefinitions = {
      content,
      styles: {
        companyName: { fontSize: 18, bold: true, color: '#111827' },
        companyInfo: { fontSize: 10, color: '#4b5563', lineHeight: 1.2 },
        documentTitle: { fontSize: 24, bold: true, color: '#2563eb' },
        documentNumber: { fontSize: 12, bold: true, color: '#6b7280' },
        documentDate: { fontSize: 10, color: '#6b7280' },
        boxTitle: { fontSize: 10, bold: true, color: '#6b7280', margin: [0, 0, 0, 5] },
        boxContent: { fontSize: 10, color: '#111827', lineHeight: 1.4 },
        tableHeader: { fontSize: 10, bold: true, color: 'white', fillColor: '#1f2937', margin: [0, 5, 0, 5] },
        totalLabel: { fontSize: 10, bold: true, alignment: 'right', margin: [0, 2, 0, 2] },
        totalValue: { fontSize: 10, alignment: 'right', margin: [0, 2, 0, 2] },
        totalLabelBold: { fontSize: 12, bold: true, alignment: 'right', margin: [0, 5, 0, 5], color: '#2563eb' },
        totalValueBold: { fontSize: 12, bold: true, alignment: 'right', margin: [0, 5, 0, 5], color: '#2563eb' },
        label: { fontSize: 10, bold: true, color: '#374151' },
        notes: { fontSize: 10, color: '#4b5563', italic: true },
        footerText: { fontSize: 8, color: '#9ca3af', alignment: 'center' }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };
    const nameSuffix = deliveries.length > 1 ? `BL_GROUP_${deliveries.length}` : deliveries[0].number;
    pdfMake.createPdf(docDefinition).download(`${nameSuffix}.pdf`);
  }
  generatePurchasesPDF(purchases: Purchase[]) {
    const settings = storageService.loadCollection('settings') as unknown as AppSettings;
    const company = settings?.company || { name: 'Ma Société' };
    const content: Content[] = [];

    purchases.forEach((purchase, index) => {
      content.push(...this.getPurchaseOrderContent(purchase, company));
      
      if (index < purchases.length - 1) {
        content.push({ text: '', pageBreak: 'after' } as unknown as Content);
      }
    });

    const docDefinition: TDocumentDefinitions = {
      content,
      styles: {
        companyName: { fontSize: 18, bold: true, color: '#111827' },
        companyInfo: { fontSize: 10, color: '#4b5563', lineHeight: 1.2 },
        documentTitle: { fontSize: 24, bold: true, color: '#2563eb' },
        documentNumber: { fontSize: 12, bold: true, color: '#6b7280' },
        documentDate: { fontSize: 10, color: '#6b7280' },
        boxTitle: { fontSize: 10, bold: true, color: '#6b7280', margin: [0, 0, 0, 5] },
        boxContent: { fontSize: 10, color: '#111827', lineHeight: 1.4 },
        tableHeader: { fontSize: 10, bold: true, color: 'white', fillColor: '#1f2937', margin: [0, 5, 0, 5] },
        totalLabel: { fontSize: 10, bold: true, alignment: 'right', margin: [0, 2, 0, 2] },
        totalValue: { fontSize: 10, alignment: 'right', margin: [0, 2, 0, 2] },
        totalLabelBold: { fontSize: 12, bold: true, alignment: 'right', margin: [0, 5, 0, 5], color: '#2563eb' },
        totalValueBold: { fontSize: 12, bold: true, alignment: 'right', margin: [0, 5, 0, 5], color: '#2563eb' },
        label: { fontSize: 10, bold: true, color: '#374151' },
        notes: { fontSize: 10, color: '#4b5563', italic: true },
        footerText: { fontSize: 8, color: '#9ca3af', alignment: 'center' }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };
    const nameSuffix = purchases.length > 1 ? `BA_GROUP_${purchases.length}` : purchases[0].number;
    pdfMake.createPdf(docDefinition).download(`${nameSuffix}.pdf`);
  }
  generateStockMovementsPDF(movements: StockMovement[]) {
    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'MOUVEMENTS DE STOCK', style: 'header' },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', 80, 100],
            body: [
              [
                { text: 'Date', style: 'tableHeader' },
                { text: 'Produit', style: 'tableHeader' },
                { text: 'Type', style: 'tableHeader' },
                { text: 'Quantité / Stock', style: 'tableHeader' }
              ],
              ...movements.map(m => [
                format(new Date(m.createdAt), 'dd/MM/yyyy HH:mm'),
                m.productName || m.productId,
                m.type,
                `${m.quantity} | ${m.previousStock} → ${m.newStock}`
              ])
            ]
          },
          layout: 'lightHorizontalLines'
        }
      ],
      styles: {
        header: { fontSize: 20, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
        tableHeader: { bold: true, fontSize: 11, fillColor: '#f3f4f6' }
      }
    };
    pdfMake.createPdf(docDefinition).download(`MVT_${movements.length}.pdf`);
  }
  private getPurchaseOrderContent(purchase: Purchase, company: any): Content[] {
    return [
        // Header
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: company.name.toUpperCase(), style: 'companyName' },
                { text: company.address || '', style: 'companyInfo' },
                { text: `${company.city || ''}`, style: 'companyInfo' },
                { text: `Tél: ${company.phone || ''}`, style: 'companyInfo' },
                { text: `Email: ${company.email || ''}`, style: 'companyInfo' },
              ]
            },
            {
              width: 'auto',
              stack: [
                { text: "BON D'ACHAT", style: 'documentTitle', alignment: 'right' },
                { text: `N° ${purchase.number}`, style: 'documentNumber', alignment: 'right' },
                { text: `Date: ${format(new Date(purchase.date), 'dd/MM/yyyy')}`, style: 'documentDate', alignment: 'right' },
              ]
            }
          ],
          margin: [0, 0, 0, 30]
        },

        // Supplier & Details Info
        {
          columns: [
            {
              width: '48%',
              stack: [
                { text: 'FOURNISSEUR', style: 'boxTitle' },
                {
                  style: 'boxContent',
                  stack: [
                    { text: purchase.supplierName || 'Nom du fournisseur', bold: true },
                  ]
                }
              ],
              style: 'box'
            },
            {
              width: '4%',
              text: ''
            },
            {
              width: '48%',
              stack: [
                { text: 'DÉTAILS', style: 'boxTitle' },
                {
                  style: 'boxContent',
                  stack: [
                    { text: `Statut: ${purchase.status.toUpperCase()}` },
                    { text: `Paiement: ${purchase.paymentStatus.toUpperCase()}` },
                    purchase.branch ? { text: `Branche: ${purchase.branch}` } : '',
                  ]
                }
              ],
              style: 'box'
            }
          ],
          margin: [0, 0, 0, 20]
        },

        // Line Items
        {
          table: {
            headerRows: 1,
            widths: ['*', 50, 70, 50, 40, 70],
            body: [
              [
                { text: 'Désignation', style: 'tableHeader' },
                { text: 'Qté', style: 'tableHeader', alignment: 'center' },
                { text: 'Prix U.', style: 'tableHeader', alignment: 'right' },
                { text: 'Rem.%', style: 'tableHeader', alignment: 'center' },
                { text: 'TVA', style: 'tableHeader', alignment: 'center' },
                { text: 'Total HT', style: 'tableHeader', alignment: 'right' }
              ],
              ...purchase.lines.map(line => [
                line.productName || 'Produit',
                { text: line.quantity.toString(), alignment: 'center' },
                { text: line.unitPrice.toFixed(2), alignment: 'right' },
                { text: line.discount > 0 ? `${line.discount}%` : '-', alignment: 'center' },
                { text: `${line.tvaRate}%`, alignment: 'center' },
                { text: line.totalHT.toFixed(2), alignment: 'right' }
              ])
            ]
          },
          layout: {
            fillColor: function (rowIndex: number) {
              return (rowIndex === 0) ? '#1f2937' : (rowIndex % 2 === 0) ? '#f9fafb' : null;
            },
            hLineWidth: function (i: number, node: any) {
              return (i === 0 || i === node.table.body.length) ? 1 : 1;
            },
            vLineWidth: function (i: number, node: any) {
              return 0;
            },
            hLineColor: function (i: number, node: any) {
              return '#e5e7eb';
            }
          },
          margin: [0, 0, 0, 20]
        },

        // Totals
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 250,
              table: {
                widths: ['*', 100],
                body: [
                  [{ text: 'Total HT', style: 'totalLabel' }, { text: `${purchase.totals.totalHT.toFixed(2)} MAD`, style: 'totalValue' }],
                  [{ text: 'Total TVA', style: 'totalLabel' }, { text: `${purchase.totals.totalTVA.toFixed(2)} MAD`, style: 'totalValue' }],
                  [{ text: 'Total TTC', style: 'totalLabelBold' }, { text: `${purchase.totals.totalTTC.toFixed(2)} MAD`, style: 'totalValueBold' }]
                ]
              },
              layout: 'noBorders'
            }
          ]
        },

        // Footer / Notes
        {
          text: 'Notes:',
          style: 'label',
          margin: [0, 30, 0, 5]
        },
        {
          text: purchase.notes || 'Aucune note.',
          style: 'notes'
        },

        // Signature
        {
          columns: [
            {
              width: '*',
              text: ''
            },
            {
              width: 200,
              stack: [
                { text: 'Signature', alignment: 'center', bold: true, margin: [0, 40, 0, 40] },
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] }
              ]
            }
          ]
        },
        
        // Footer text
        {
          text: `${company.name} - ${company.address || ''} - ICE: ${company.ice || 'N/A'}`,
          style: 'footerText',
          absolutePosition: { x: 40, y: 800 } // Bottom of page
        }
    ];
  }
  private getDeliveryOrderContent(delivery: DeliveryNote, company: any): Content[] {
    return [
        // Header
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: company.name.toUpperCase(), style: 'companyName' },
                { text: company.address || '', style: 'companyInfo' },
                { text: `${company.city || ''}`, style: 'companyInfo' },
                { text: `Tél: ${company.phone || ''}`, style: 'companyInfo' },
                { text: `Email: ${company.email || ''}`, style: 'companyInfo' },
              ]
            },
            {
              width: 'auto',
              stack: [
                { text: "BON DE LIVRAISON", style: 'documentTitle', alignment: 'right' },
                { text: `N° ${delivery.number}`, style: 'documentNumber', alignment: 'right' },
                { text: `Date: ${format(new Date(delivery.date), 'dd/MM/yyyy')}`, style: 'documentDate', alignment: 'right' },
              ]
            }
          ],
          margin: [0, 0, 0, 30]
        },

        // Client & Transport Info
        {
          columns: [
            {
              width: '48%',
              stack: [
                { text: 'CLIENT', style: 'boxTitle' },
                {
                  style: 'boxContent',
                  stack: [
                    { text: delivery.clientName || 'Nom du client', bold: true },
                  ]
                }
              ],
              style: 'box'
            },
            {
              width: '4%',
              text: ''
            },
            {
              width: '48%',
              stack: [
                { text: 'TRANSPORT', style: 'boxTitle' },
                {
                  style: 'boxContent',
                  stack: [
                    { text: `Chauffeur: ${delivery.driverName || 'N/A'}` },
                    { text: `Véhicule: ${delivery.vehicleInfo || 'N/A'}` },
                    { text: `Statut: ${delivery.status.toUpperCase()}` },
                  ]
                }
              ],
              style: 'box'
            }
          ],
          margin: [0, 0, 0, 20]
        },

        // Line Items
        {
          table: {
            headerRows: 1,
            widths: ['*', 50, 70, 50, 40, 70],
            body: [
              [
                { text: 'Désignation', style: 'tableHeader' },
                { text: 'Qté', style: 'tableHeader', alignment: 'center' },
                { text: 'Prix U.', style: 'tableHeader', alignment: 'right' },
                { text: 'Rem.%', style: 'tableHeader', alignment: 'center' },
                { text: 'TVA', style: 'tableHeader', alignment: 'center' },
                { text: 'Total HT', style: 'tableHeader', alignment: 'right' }
              ],
              ...delivery.lines.map(line => [
                line.productName || 'Produit',
                { text: line.quantity.toString(), alignment: 'center' },
                { text: line.unitPrice.toFixed(2), alignment: 'right' },
                { text: line.discount > 0 ? `${line.discount}%` : '-', alignment: 'center' },
                { text: `${line.tvaRate}%`, alignment: 'center' },
                { text: line.totalHT.toFixed(2), alignment: 'right' }
              ])
            ]
          },
          layout: {
            fillColor: function (rowIndex: number) {
              return (rowIndex === 0) ? '#1f2937' : (rowIndex % 2 === 0) ? '#f9fafb' : null;
            },
            hLineWidth: function (i: number, node: any) {
              return (i === 0 || i === node.table.body.length) ? 1 : 1;
            },
            vLineWidth: function (i: number, node: any) {
              return 0;
            },
            hLineColor: function (i: number, node: any) {
              return '#e5e7eb';
            }
          },
          margin: [0, 0, 0, 20]
        },

        // Totals
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 250,
              table: {
                widths: ['*', 100],
                body: [
                  [{ text: 'Total HT', style: 'totalLabel' }, { text: `${delivery.totals.totalHT.toFixed(2)} MAD`, style: 'totalValue' }],
                  [{ text: 'Total TVA', style: 'totalLabel' }, { text: `${delivery.totals.totalTVA.toFixed(2)} MAD`, style: 'totalValue' }],
                  [{ text: 'Total TTC', style: 'totalLabelBold' }, { text: `${delivery.totals.totalTTC.toFixed(2)} MAD`, style: 'totalValueBold' }]
                ]
              },
              layout: 'noBorders'
            }
          ]
        },

        // Footer / Notes
        {
          text: 'Notes:',
          style: 'label',
          margin: [0, 30, 0, 5]
        },
        {
          text: delivery.notes || 'Aucune note.',
          style: 'notes'
        },

        // Signature
        {
          columns: [
            {
              width: '*',
              text: ''
            },
            {
              width: 200,
              stack: [
                { text: 'Signature', alignment: 'center', bold: true, margin: [0, 40, 0, 40] },
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] }
              ]
            }
          ]
        },
        
        // Footer text
        {
          text: `${company.name} - ${company.address || ''} - ICE: ${company.ice || 'N/A'}`,
          style: 'footerText',
          absolutePosition: { x: 40, y: 800 } // Bottom of page
        }
    ];
  }

  private getQuotationContent(quotation: Quotation, company: any): Content[] {
    return [
        // Header
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: company.name.toUpperCase(), style: 'companyName' },
                { text: company.address || '', style: 'companyInfo' },
                { text: `${company.city || ''}`, style: 'companyInfo' },
                { text: `Tél: ${company.phone || ''}`, style: 'companyInfo' },
                { text: `Email: ${company.email || ''}`, style: 'companyInfo' },
              ]
            },
            {
              width: 'auto',
              stack: [
                { text: "DEVIS", style: 'documentTitle', alignment: 'right' },
                { text: `N° ${quotation.number}`, style: 'documentNumber', alignment: 'right' },
                { text: `Date: ${format(new Date(quotation.date), 'dd/MM/yyyy')}`, style: 'documentDate', alignment: 'right' },
                quotation.validUntil ? { text: `Valide jusqu'au: ${format(new Date(quotation.validUntil), 'dd/MM/yyyy')}`, style: 'documentDate', alignment: 'right' } : '',
              ]
            }
          ],
          margin: [0, 0, 0, 30]
        },

        // Client & Details Info
        {
          columns: [
            {
              width: '48%',
              stack: [
                { text: 'CLIENT', style: 'boxTitle' },
                {
                  style: 'boxContent',
                  stack: [
                    { text: quotation.clientName || 'Nom du client', bold: true },
                  ]
                }
              ],
              style: 'box'
            },
            {
              width: '4%',
              text: ''
            },
            {
              width: '48%',
              stack: [
                { text: 'DÉTAILS', style: 'boxTitle' },
                {
                  style: 'boxContent',
                  stack: [
                    { text: `Statut: ${quotation.status.toUpperCase()}` },
                  ]
                }
              ],
              style: 'box'
            }
          ],
          margin: [0, 0, 0, 20]
        },

        // Line Items
        {
          table: {
            headerRows: 1,
            widths: ['*', 50, 70, 50, 40, 70],
            body: [
              [
                { text: 'Désignation', style: 'tableHeader' },
                { text: 'Qté', style: 'tableHeader', alignment: 'center' },
                { text: 'Prix U.', style: 'tableHeader', alignment: 'right' },
                { text: 'Rem.%', style: 'tableHeader', alignment: 'center' },
                { text: 'TVA', style: 'tableHeader', alignment: 'center' },
                { text: 'Total HT', style: 'tableHeader', alignment: 'right' }
              ],
              ...quotation.lines.map(line => [
                line.productName || 'Produit',
                { text: line.quantity.toString(), alignment: 'center' },
                { text: line.unitPrice.toFixed(2), alignment: 'right' },
                { text: line.discount > 0 ? `${line.discount}%` : '-', alignment: 'center' },
                { text: `${line.tvaRate}%`, alignment: 'center' },
                { text: line.totalHT.toFixed(2), alignment: 'right' }
              ])
            ]
          },
          layout: {
            fillColor: function (rowIndex: number) {
              return (rowIndex === 0) ? '#1f2937' : (rowIndex % 2 === 0) ? '#f9fafb' : null;
            },
            hLineWidth: function (i: number, node: any) {
              return (i === 0 || i === node.table.body.length) ? 1 : 1;
            },
            vLineWidth: function (i: number, node: any) {
              return 0;
            },
            hLineColor: function (i: number, node: any) {
              return '#e5e7eb';
            }
          },
          margin: [0, 0, 0, 20]
        },

        // Totals
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 250,
              table: {
                widths: ['*', 100],
                body: [
                  [{ text: 'Total HT', style: 'totalLabel' }, { text: `${quotation.totals.totalHT.toFixed(2)} MAD`, style: 'totalValue' }],
                  ...(quotation.totals.totalDiscount > 0 ? [
                    [{ text: 'Total Remise', style: 'totalLabel' }, { text: `${quotation.totals.totalDiscount.toFixed(2)} MAD`, style: 'totalValue' }]
                  ] : []),
                  [{ text: 'Total TVA', style: 'totalLabel' }, { text: `${quotation.totals.totalTVA.toFixed(2)} MAD`, style: 'totalValue' }],
                  [{ text: 'Total TTC', style: 'totalLabelBold' }, { text: `${quotation.totals.totalTTC.toFixed(2)} MAD`, style: 'totalValueBold' }]
                ]
              },
              layout: 'noBorders'
            }
          ]
        },

        // Footer / Notes
        {
          text: 'Notes:',
          style: 'label',
          margin: [0, 30, 0, 5]
        },
        {
          text: quotation.notes || 'Aucune note.',
          style: 'notes'
        },

        // Signature
        {
          columns: [
            {
              width: '*',
              text: ''
            },
            {
              width: 200,
              stack: [
                { text: 'Signature', alignment: 'center', bold: true, margin: [0, 40, 0, 40] },
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] }
              ]
            }
          ]
        },
        
        // Footer text
        {
          text: `${company.name} - ${company.address || ''} - ICE: ${company.ice || 'N/A'}`,
          style: 'footerText',
          absolutePosition: { x: 40, y: 800 } // Bottom of page
        }
    ];
  }

  /**
   * Generates a PDF for the Accounting Journal
   */
  generateJournalPDF(entries: JournalEntry[], periodStr: string) {
    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'JOURNAL COMPTABLE', style: 'header' },
        { text: `Période: ${periodStr}`, style: 'subheader', margin: [0, 0, 0, 20] },
        
        {
          table: {
            headerRows: 1,
            widths: [60, 40, 80, '*', 70, 70],
            body: [
              [
                { text: 'Date', style: 'tableHeader' },
                { text: 'Type', style: 'tableHeader' },
                { text: 'Réf.', style: 'tableHeader' },
                { text: 'Description', style: 'tableHeader' },
                { text: 'Débit', style: 'tableHeader', alignment: 'right' },
                { text: 'Crédit', style: 'tableHeader', alignment: 'right' }
              ],
              ...entries.map(entry => [
                format(new Date(entry.date), 'dd/MM/yyyy'),
                entry.type,
                entry.reference,
                entry.description || '',
                { text: entry.debitAmount > 0 ? entry.debitAmount.toFixed(2) : '', alignment: 'right' },
                { text: entry.creditAmount > 0 ? entry.creditAmount.toFixed(2) : '', alignment: 'right' }
              ])
            ]
          },
          layout: 'lightHorizontalLines'
        },
        
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 200,
              margin: [0, 20, 0, 0],
              table: {
                widths: ['*', '*'],
                body: [
                  [
                    { text: 'Total Débit', bold: true },
                    { text: entries.reduce((sum, e) => sum + e.debitAmount, 0).toFixed(2), alignment: 'right', bold: true }
                  ],
                  [
                    { text: 'Total Crédit', bold: true },
                    { text: entries.reduce((sum, e) => sum + e.creditAmount, 0).toFixed(2), alignment: 'right', bold: true }
                  ]
                ]
              },
              layout: 'noBorders'
            }
          ]
        }
      ],
      styles: {
        header: { fontSize: 22, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
        subheader: { fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
        tableHeader: { bold: true, fontSize: 10, fillColor: '#f3f4f6' }
      },
      pageOrientation: 'landscape'
    };
    
    pdfMake.createPdf(docDefinition).download(`JOURNAL_${periodStr.replace(/\//g, '-')}.pdf`);
  }

  /**
   * Generates a PDF for the Trial Balance
   */
  generateTrialBalancePDF(data: { account: string; debit: number; credit: number; balance: number }[], periodStr: string) {
    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'BALANCE GÉNÉRALE', style: 'header' },
        { text: `Période: ${periodStr}`, style: 'subheader', margin: [0, 0, 0, 20] },
        
        {
          table: {
            headerRows: 1,
            widths: ['*', 100, 100, 100],
            body: [
              [
                { text: 'Compte', style: 'tableHeader' },
                { text: 'Débit', style: 'tableHeader', alignment: 'right' },
                { text: 'Crédit', style: 'tableHeader', alignment: 'right' },
                { text: 'Solde', style: 'tableHeader', alignment: 'right' }
              ],
              ...data.map(row => [
                row.account,
                { text: row.debit.toFixed(2), alignment: 'right' },
                { text: row.credit.toFixed(2), alignment: 'right' },
                { text: row.balance.toFixed(2), alignment: 'right', bold: true, color: row.balance < 0 ? 'red' : 'black' }
              ])
            ]
          },
          layout: 'lightHorizontalLines'
        },
        
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 300,
              margin: [0, 20, 0, 0],
              table: {
                widths: ['*', 100],
                body: [
                  [
                    { text: 'Total Débit', bold: true },
                    { text: data.reduce((sum, r) => sum + r.debit, 0).toFixed(2), alignment: 'right', bold: true }
                  ],
                  [
                    { text: 'Total Crédit', bold: true },
                    { text: data.reduce((sum, r) => sum + r.credit, 0).toFixed(2), alignment: 'right', bold: true }
                  ]
                ]
              },
              layout: 'noBorders'
            }
          ]
        }
      ],
      styles: {
        header: { fontSize: 22, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
        subheader: { fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
        tableHeader: { bold: true, fontSize: 11, fillColor: '#f3f4f6' }
      }
    };
    
    pdfMake.createPdf(docDefinition).download(`BALANCE_${periodStr.replace(/\//g, '-')}.pdf`);
  }

  /**
   * Generates a PDF for the VAT Report
   */
  generateVATReportPDF(data: { collected: number; deductible: number; toPay: number; details: any[] }, periodStr: string) {
    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'DÉCLARATION TVA', style: 'header' },
        { text: `Période: ${periodStr}`, style: 'subheader', margin: [0, 0, 0, 20] },
        
        {
          style: 'summaryBox',
          table: {
            widths: ['*', 150],
            body: [
              [
                { text: 'TVA Collectée (Ventes)', style: 'label' },
                { text: `${data.collected.toFixed(2)} MAD`, alignment: 'right' }
              ],
              [
                { text: 'TVA Déductible (Achats)', style: 'label' },
                { text: `${data.deductible.toFixed(2)} MAD`, alignment: 'right' }
              ],
              [
                { text: 'TVA À PAYER', style: 'totalLabel' },
                { text: `${data.toPay.toFixed(2)} MAD`, style: 'totalValue' }
              ]
            ]
          },
          layout: 'noBorders'
        },
        
        { text: 'Détails par taux', style: 'sectionHeader', margin: [0, 20, 0, 10] },
        
        {
          table: {
            headerRows: 1,
            widths: ['*', 100, 100],
            body: [
              [
                { text: 'Taux TVA', style: 'tableHeader' },
                { text: 'Base HT', style: 'tableHeader', alignment: 'right' },
                { text: 'Montant TVA', style: 'tableHeader', alignment: 'right' }
              ],
              ...data.details.map(row => [
                { text: `${row.rate}%`, alignment: 'center' },
                { text: row.baseHT.toFixed(2), alignment: 'right' },
                { text: row.tvaAmount.toFixed(2), alignment: 'right' }
              ])
            ]
          },
          layout: 'lightHorizontalLines'
        },
        
        {
          text: 'Ce document est généré à titre indicatif et ne remplace pas la déclaration officielle.',
          style: 'footerText',
          margin: [0, 30, 0, 0]
        }
      ],
      styles: {
        header: { fontSize: 22, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
        subheader: { fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
        sectionHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 10] },
        label: { fontSize: 12, margin: [0, 5, 0, 5] },
        totalLabel: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
        totalValue: { fontSize: 14, bold: true, alignment: 'right', margin: [0, 10, 0, 5], color: '#2563eb' },
        tableHeader: { bold: true, fontSize: 11, fillColor: '#f3f4f6' },
        footerText: { fontSize: 10, italic: true, alignment: 'center', color: '#6b7280' },
        summaryBox: { margin: [0, 0, 0, 20] }
      }
    };
    
    pdfMake.createPdf(docDefinition).download(`TVA_${periodStr.replace(/\//g, '-')}.pdf`);
  }

  private renderLinesTable(lines: DocumentLine[]): Content {
    return {
      table: {
        headerRows: 1,
        widths: ['*', 50, 80, 50, 80],
        body: [
          [
            { text: 'Désignation', style: 'tableHeader' },
            { text: 'Qté', style: 'tableHeader', alignment: 'center' },
            { text: 'P.U. HT', style: 'tableHeader', alignment: 'right' },
            { text: 'TVA', style: 'tableHeader', alignment: 'center' },
            { text: 'Total TTC', style: 'tableHeader', alignment: 'right' }
          ],
          ...lines.map(line => [
            line.productName || 'Produit inconnu',
            { text: line.quantity.toString(), alignment: 'center' },
            { text: line.unitPrice.toFixed(2), alignment: 'right' },
            { text: `${line.tvaRate}%`, alignment: 'center' },
            { text: line.totalTTC.toFixed(2), alignment: 'right' }
          ])
        ]
      },
      layout: 'lightHorizontalLines'
    };
  }
}

export const pdfService = new PdfService();
export default pdfService;
