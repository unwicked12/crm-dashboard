declare module 'jspdf' {
  class jsPDF {
    constructor(options?: { orientation?: string; unit?: string; format?: string; compress?: boolean });
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
    addImage(
      imageData: string | HTMLImageElement | HTMLCanvasElement,
      format: string,
      x: number,
      y: number,
      width?: number,
      height?: number,
      alias?: string,
      compression?: 'NONE' | 'FAST' | 'MEDIUM' | 'SLOW',
      rotation?: number
    ): jsPDF;
    output(type: 'datauristring' | 'dataurlstring' | 'dataurl' | 'datauri' | 'pdfobjectnewwindow' | 'pdfjsnewwindow' | 'dataurlnewwindow', options?: { filename?: string; compress?: boolean }): string | Window | boolean;
  }
  export default jsPDF;
}

declare module 'jspdf-autotable' {} 