import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

function PdfPreview(props: { src: string; alt?: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renderPdf() {
      try {
        setError(false);

        const res = await fetch(props.src);
        if (!res.ok) {
          throw new Error(`Failed to fetch PDF: ${res.status} ${res.statusText}`);
        }

        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("text/html")) {
          throw new Error(`Expected PDF but got HTML from ${props.src}`);
        }

        const buffer = await res.arrayBuffer();

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
        } as any);

        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvas,
          canvasContext: context,
          viewport,
        }).promise;
      } catch (err) {
        console.error("Failed to load PDF preview:", err);
        if (!cancelled) setError(true);
      }
    }

    renderPdf();

    return () => {
      cancelled = true;
    };
  }, [props.src]);

  if (error) {
    return <div className={props.className}>Failed to load PDF preview.</div>;
  }

  return (
    <canvas
      ref={canvasRef}
      className={props.className}
      aria-label={props.alt || "PDF preview"}
    />
  );
}

export default PdfPreview;

// import { useEffect, useRef, useState } from "react";
// import * as pdfjsLib from "pdfjs-dist";

// function PdfPreview(props: { src: string; alt?: string; className?: string }) {
//   const canvasRef = useRef<HTMLCanvasElement | null>(null);
//   const [error, setError] = useState(false);

//   useEffect(() => {
//     let cancelled = false;

//     async function renderPdf() {
//       try {
//         setError(false);

//         const loadingTask = pdfjsLib.getDocument({
//           url: props.src,
//           disableWorker: true,
//         } as any);

//         const pdf = await loadingTask.promise;
//         const page = await pdf.getPage(1);

//         const viewport = page.getViewport({ scale: 1.5 });
//         const canvas = canvasRef.current;
//         if (!canvas || cancelled) return;

//         const context = canvas.getContext("2d");
//         if (!context) return;

//         canvas.width = viewport.width;
//         canvas.height = viewport.height;

//         await page.render({
//           canvas,
//           canvasContext: context,
//           viewport,
//         }).promise;
//       } catch (err) {
//         console.error("Failed to render PDF preview:", err);
//         if (!cancelled) setError(true);
//       }
//     }

//     renderPdf();

//     return () => {
//       cancelled = true;
//     };
//   }, [props.src]);

//   if (error) {
//     return <div className={props.className}>Failed to load PDF preview.</div>;
//   }

//   return (
//     <canvas
//       ref={canvasRef}
//       className={props.className}
//       aria-label={props.alt || "PDF preview"}
//     />
//   );
// }

// export default PdfPreview;