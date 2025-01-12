declare module 'jspdf' {
  class jsPDF {
    constructor(options?: { orientation?: string; unit?: string; format?: string });
    internal: {
      pageSize: {
        getWidth: () => number;
        getHeight: () => number;
      };
    };
    setFontSize(size: number): void;
    setTextColor(r: number, g: number, b: number): void;
    text(text: string, x: number, y: number, options?: { align: string }): void;
    rect(x: number, y: number, w: number, h: number, style: string): void;
    setFillColor(r: number, g: number, b: number): void;
    save(filename: string): void;
    autoTable: (options: any) => jsPDF;
  }
  export default jsPDF;
}

declare module 'jspdf-autotable' {} 