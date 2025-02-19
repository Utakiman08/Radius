import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Assign fonts to pdfMake
(pdfMake as any).vfs = (pdfFonts as any).vfs;



@Injectable({
  providedIn: 'root'
})
export class PdfmakeService {
  constructor() {}


  
  generatePDF(data: any, reportname: string,excludedkey:string[] = [],tableheader:number=10,column:number =10): void {
    const excludedKeys = excludedkey;

    console.log(data);
    const headers = Object.keys(data[0]).filter(key => !excludedKeys.includes(key));
    const columnWidths = headers.length > 8 ? Array(headers.length).fill('auto') : Array(headers.length).fill('*');
    const docDefinition: any = {
      pageOrientation: 'landscape',
      pageMargins: [20, 20, 20, 20],
  
      content: [
        { text: reportname, style: 'header', alignment: 'center' },
        { text: '\n' },
        {
          table: {
            headerRows: 1,
            
            widths: headers.map(() => columnWidths), // Make all columns take equal space
            body: [
              // Dynamically generate headers
              
              headers.map(header => ({ text: this.formatHeader(header), style: 'tableHeader',margin:[5,0,5,0] })),
  
              // Dynamically generate table rows
              ...data.map((item: any) => headers.map(header => ({text: item[header] , style: 'Columns',margin:[5,0,5,0]}) ))
            ]
          },
          layout: ''
        },
        // { text: `\nTotal Records: ${data.length}`, style: 'subheader' }
      ],
  
      footer: function (currentPage: number, pageCount: number) {
        return {
          columns: [
            { text: `Page ${currentPage} of ${pageCount}`, style: 'small' },
            { text: `Generated on: ${new Date().toLocaleString()}`, alignment: 'right', style: 'small' }
          ],
          margin: [20, 0, 20, 0]
        };
      },
  
      styles: {
        header: { fontSize: 25, bold: true },
        Columns: {fontSize:column,alignment:'left'},
        subheader: { fontSize:8 }, // Padding for subheader
        small: { fontSize: 6 },
        tableHeader: { fontSize:tableheader, bold: true, fillColor: '#DDEEFF' }
      }
    };
  
    pdfMake.createPdf(docDefinition).open();
  }
  

  formatHeader(header: String): String {
    return header.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }

  formatDocument(data: any): any {
    let dataJson: any = {};

    dataJson.watermark = {
      text: data.source,
      angle: 300,
      opacity: 0.1,
      bold: true,
      italics: false
    };

    dataJson.content = [];
    dataJson.defaultStyle = {
      alignment: 'justify'
    };
    dataJson.styles = this.returnStyle();

    data.ConsumerData.forEach((element: any, index: number) => {
      let pageBreak = index > 0 ? 'before' : '';

      dataJson.content.push({
        text: data.Header,
        style: 'header',
        pageBreak: pageBreak
      });

      dataJson.content.push({
        alignment: 'justify',
        style: 'ReportHeader',
        columns: [
          {
            text: `Currency : ${element.Rightf} \n Reading Unit : ${element.RightS}`
          },
          {
            text: `Page ${data.ConsumerData.length} of ${index + 1}`,
            alignment: 'right'
          }
        ]
      });

      if (element.Subheader) {
        let value = this.horizontalTable(element.Subheader, 'Normal');
        dataJson.content.push({
          style: 'table',
          table: {
            widths: this.getArrayAccordingLength(element.Subheader[0].length),
            body: value
          }
        });
      }

      if (element.Firstsection) {
        dataJson.content.push({
          style: 'table',
          table: {
            widths: ['*', '*'],
            body: [
              [
                {
                  table: {
                    widths: ['*', '*'],
                    body: [
                      ...this.verticalTable(element.Firstsection, 'left'),
                      [
                        {
                          table: {
                            widths: ['*', '*', '*', '*'],
                            body: this.horizontalTable(element.Firstinnersection.tabledata, 'Normal')
                          },
                          colSpan: element.Firstinnersection.colspan
                        }
                      ],
                      [
                        {
                          text: element.Secondinnersection.CenterinnerText,
                          style: 'ReportHeader',
                          alignment: 'center',
                          colSpan: 2
                        }
                      ],
                      [
                        {
                          table: {
                            widths: ['*', '*', '*', '*'],
                            body: this.horizontalTable(element.Secondinnersection.tableData, 'Normal')
                          },
                          colSpan: 2
                        }
                      ]
                    ]
                  },
                  layout: 'headerLineOnly'
                },
                {
                  table: {
                    widths: ['*', '*'],
                    body: [...this.verticalTable(element.SecondSection, 'left')]
                  },
                  layout: 'headerLineOnly'
                }
              ]
            ]
          }
        });
      }

      if (element.ThirdSection) {
        dataJson.content.push({
          style: 'table',
          table: {
            widths: ['*', '*'],
            body: [
              [
                {
                  table: {
                    widths: ['*', '*'],
                    body: [...this.verticalTable(element.ThirdSection.Firstsection, 'left')]
                  },
                  layout: 'headerLineOnly'
                },
                {
                  table: {
                    widths: ['*', '*'],
                    body: [...this.verticalTable(element.ThirdSection.SecondSection, 'left')]
                  },
                  layout: 'headerLineOnly'
                }
              ]
            ]
          }
        });
      }

      if (element.Traiffcard) {
        let value = {
          style: 'table',
          table: {
            widths: this.getArrayAccordingLength(element.Traiffcard[0].length),
            body: this.horizontalTable(element.Traiffcard, 'Traiff')
          }
        };
        dataJson.content.push(value);
      }

      if (element.recipt) {
        dataJson.content.push({
          style: 'table',
          table: {
            widths: ['*', '*'],
            body: [
              [
                {
                  text: 'Recipt',
                  style: 'ReportHeader',
                  alignment: 'center',
                  colSpan: 2
                },
                ''
              ],
              [
                {
                  table: {
                    widths: ['*', '*'],
                    body: [...this.verticalTable(element.recipt.Firstsection, 'left')]
                  },
                  layout: 'headerLineOnly'
                },
                {
                  table: {
                    widths: ['*', '*'],
                    body: [...this.verticalTable(element.recipt.SecondSection, 'left')]
                  },
                  layout: 'headerLineOnly'
                }
              ]
            ]
          }
        });
      }
    });
    pdfMake.createPdf(dataJson).open()
    return dataJson;
  }
  
  private getArrayAccordingLength(length: number): string[] {
    return Array.from({ length }, () => '*');
  }

  private horizontalTable(data: any, paramHeader: string): any[] {
    let dataJson: any[] = paramHeader !== 'Normal' ? [[{ text: paramHeader, style: 'ReportHeader', alignment: 'center', colSpan: 4 }, '', '', ''], []] : [[]];
    data.forEach((item: any[], index: number) => {
      dataJson.push([]);
      item.forEach(value => {
        let header = { text: value.key, style: 'tableHeader', alignment: 'center' };
        let valueData = { text: value.value || '-', alignment: 'center', style: 'tablesubHeader' };
        if (index === 0) {
          paramHeader !== 'Normal' ? dataJson[1].push(header) : dataJson[0].push(header);
        }
        paramHeader !== 'Normal' ? dataJson[index + 2].push(valueData) : dataJson[index + 1].push(valueData);
      });
    });
    return dataJson;
  }

  returnStyle() {
    return {
      header: { fontSize: 15, bold: true, margin: [0, 0, 0, 0], alignment: 'center' },
      subheader: { fontSize: 11 },
      table: { margin: [0, 0, 0, 1], fontSize: 7 },
      tableHeader: { bold: true, fontSize: 9, color: 'black' },
      tablesubHeader: { bold: true, fontSize: 8, color: 'black' },
      ReportHeader: { bold: true, fontSize: 7, color: 'black' },
    };
  }
   verticalTable(data: any[], valueAlign: string) {
    let dataJson: any[] = [];
    data.forEach(value => {
      let colValue = value.value;
      if (colValue) {
        dataJson.push([
          { text: value.key, style: 'ReportHeader' },
          { text: colValue ? colValue : '-', style: 'tableHeader', alignment: valueAlign }
        ]);
      } else {
        dataJson.push([{ text: value.key, style: 'ReportHeader', colSpan: value.colspan }, { text: '-' }]);
      }
    });
    return dataJson;
  }
}
