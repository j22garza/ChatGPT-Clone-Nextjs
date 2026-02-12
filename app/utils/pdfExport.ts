/**
 * Descarga el reporte como archivo PDF (sin abrir impresora).
 * Usa html2canvas + jspdf en el cliente para generar el PDF.
 */

export function triggerPrint(printAreaRef: HTMLElement | null) {
  if (typeof window === "undefined" || !printAreaRef) return;

  const run = async () => {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const wrap = document.createElement("div");
    wrap.id = "pdf-export-wrap";
    wrap.style.cssText =
      "position:fixed;left:-9999px;top:0;width:800px;max-width:95vw;background:#fff;color:#111;padding:24px;font-family:system-ui,sans-serif;font-size:12pt;box-sizing:border-box;";
    wrap.innerHTML = printAreaRef.innerHTML;

    const style = document.createElement("style");
    style.textContent = `
      #pdf-export-wrap, #pdf-export-wrap * { color: #111 !important; background-color: transparent !important; }
      #pdf-export-wrap th { background-color: #1e3a5f !important; color: #fff !important; }
      #pdf-export-wrap table { border-collapse: collapse; }
      #pdf-export-wrap th, #pdf-export-wrap td { border: 1px solid #333 !important; padding: 6px 8px !important; }
      #pdf-export-wrap section { border: 1px solid #ddd !important; margin-bottom: 12px !important; padding: 12px !important; background: #fff !important; }
      #pdf-export-wrap h1, #pdf-export-wrap h2, #pdf-export-wrap h3 { color: #111 !important; border-color: #ddd !important; }
    `;
    wrap.prepend(style);
    const all = wrap.querySelectorAll("*");
    all.forEach((el) => {
      const e = el as HTMLElement;
      e.style.setProperty("color", "#111", "important");
      if (e.tagName !== "TH") {
        e.style.setProperty("background-color", "transparent", "important");
      }
    });
    wrap.querySelectorAll("th").forEach((el) => {
      const e = el as HTMLElement;
      e.style.setProperty("background-color", "#1e3a5f", "important");
      e.style.setProperty("color", "#fff", "important");
    });
    document.body.appendChild(wrap);

    try {
      const canvas = await html2canvas(wrap, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      document.body.removeChild(wrap);

      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const w = pageW - margin * 2;
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = w / imgW;
      const h = imgH * ratio;

      const drawH = pageH - margin * 2;
      if (h <= drawH) {
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, w, h);
      } else {
        const sliceHeight = (drawH / h) * imgH;
        let offset = 0;
        let pageNum = 0;
        while (offset < imgH) {
          const sh = Math.min(sliceHeight, imgH - offset);
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = imgW;
          pageCanvas.height = sh;
          const ctx = pageCanvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, imgW, sh);
            ctx.drawImage(canvas, 0, offset, imgW, sh, 0, 0, imgW, sh);
          }
          const pageImgH = (sh * w) / imgW;
          if (pageNum > 0) pdf.addPage();
          pdf.addImage(pageCanvas.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, w, pageImgH);
          offset += sh;
          pageNum++;
        }
      }

      pdf.save("reporte-connie.pdf");
    } catch (e) {
      document.body.removeChild(wrap);
      console.error("Error generando PDF:", e);
      window.alert("No se pudo generar el PDF. Intenta de nuevo.");
    }
  };

  run();
}
