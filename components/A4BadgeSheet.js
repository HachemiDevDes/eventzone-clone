/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import { QrCode as QrIcon, Scissors, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";

/**
 * A4BadgeSheet
 * Renders an A4 4-fold conference badge sheet (210 x 297 mm):
 * - Uploaded A4 template artwork background
 * - Top-Left Quadrant: Centered Attendee Badge
 * - Top-Right Quadrant: Centered Attendee Badge (Duplicate / Back)
 * - Bottom-Left & Bottom-Right Quadrants: Open template / fold section
 * - Optional Center Fold / Cut Crosshairs
 */
export default function A4BadgeSheet({
  templateUrl = "",
  attendeeName = "Elena Rostova",
  attendeePhoto = "",
  attendeeCompany = "InnovateTech Labs",
  attendeeJobTitle = "Delegate",
  ticketType = "VIP Access Pass",
  badgeCode = "EZ-8942-ELN",
  eventTitle = "Global Tech Summit 2026",
  eventDate = "",
  eventLocation = "",
  qrCodeUrl = "",
  showFoldGuide = true,
  showPhoto = true,
  showQr = true,
  cardTheme = "white", // "white" | "glass" | "clean"
  className = "",
  isPrintTarget = false,
}) {
  const [generatedQr, setGeneratedQr] = useState(qrCodeUrl || "");

  // Generate QR if no URL provided
  useEffect(() => {
    if (qrCodeUrl) {
      setGeneratedQr(qrCodeUrl);
      return;
    }
    const generate = async () => {
      try {
        const payload = JSON.stringify({
          badgeCode: badgeCode || "EZ-PASS",
          attendee: attendeeName,
          tier: ticketType,
          event: eventTitle,
          verified: true
        });
        const url = await QRCode.toDataURL(payload, {
          width: 240,
          margin: 1,
          color: { dark: "#0f172a", light: "#ffffff" }
        });
        setGeneratedQr(url);
      } catch (err) {
        console.warn("QR generation fallback:", err);
      }
    };
    generate();
  }, [qrCodeUrl, badgeCode, attendeeName, ticketType, eventTitle]);

  // Card Background styling based on theme
  const getCardStyle = () => {
    if (cardTheme === "glass") {
      return "bg-white/85 backdrop-blur-md border border-white/60 shadow-lg text-slate-900";
    }
    if (cardTheme === "clean") {
      return "bg-transparent border-2 border-slate-900/40 text-slate-900";
    }
    // Default solid white
    return "bg-white border border-slate-200/90 shadow-md text-slate-900";
  };

  // Render Single Attendee Badge Card
  const renderBadgeCard = (keySuffix = "front") => {
    const isVip = (ticketType || "").toLowerCase().includes("vip");
    
    return (
      <div
        key={keySuffix}
        className={`w-full max-w-[145px] sm:max-w-[170px] rounded-2xl p-3 sm:p-3.5 flex flex-col items-center justify-between text-center transition-all ${getCardStyle()}`}
        style={{ minHeight: "185px" }}
      >
        {/* Top Header / Tier Ribbon */}
        <div className="w-full flex items-center justify-between gap-1 pb-1.5 border-b border-slate-100/80">
          <span className={`px-2 py-0.5 rounded-full text-[7.5px] sm:text-[8.5px] font-extrabold uppercase tracking-wider truncate ${
            isVip
              ? "bg-amber-100 text-amber-900 border border-amber-300"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}>
            {ticketType || "General Pass"}
          </span>
          <ShieldCheck size={11} className={isVip ? "text-amber-600" : "text-blue-600"} />
        </div>

        {/* Middle Attendee Info (Photo + Name + Org) */}
        <div className="flex flex-col items-center my-auto py-1 w-full">
          {showPhoto && (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-slate-900/10 shadow-xs bg-slate-100 flex items-center justify-center shrink-0 mb-1.5">
              {attendeePhoto ? (
                <img
                  src={attendeePhoto}
                  alt={attendeeName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-sm sm:text-base flex items-center justify-center">
                  {(attendeeName || "Attendee")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
            </div>
          )}

          <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-tight line-clamp-1 w-full">
            {attendeeName || "Attendee Name"}
          </h3>

          {attendeeJobTitle && (
            <p className="text-[8px] sm:text-[9px] font-bold text-blue-600 uppercase tracking-wide line-clamp-1 mt-0.5">
              {attendeeJobTitle}
            </p>
          )}

          <p className="text-[8px] sm:text-[9px] font-semibold text-slate-600 line-clamp-1 mt-0.5">
            {attendeeCompany || eventTitle}
          </p>
        </div>

        {/* Bottom QR & Badge Code */}
        {showQr && (
          <div className="w-full pt-1 border-t border-slate-100 flex items-center justify-between gap-1.5">
            <div className="text-left flex flex-col leading-none">
              <span className="text-[6.5px] uppercase font-extrabold text-slate-400">Badge ID</span>
              <span className="text-[8px] sm:text-[9px] font-black font-mono text-slate-900 mt-0.5">
                {badgeCode || "EZ-PASS"}
              </span>
            </div>

            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center">
              {generatedQr ? (
                <img src={generatedQr} alt="QR" className="w-full h-full object-contain" />
              ) : (
                <QrIcon size={20} className="text-slate-700" />
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id={isPrintTarget ? "printable-a4-sheet" : undefined}
      className={`relative w-full aspect-[210/297] bg-white text-slate-900 overflow-hidden shadow-2xl rounded-2xl border border-slate-300 font-sans select-none ${className}`}
      style={{
        backgroundImage: templateUrl ? `url(${templateUrl})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* Fallback stylized background if no custom template uploaded */}
      {!templateUrl && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-100 pointer-events-none opacity-90">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500" />
        </div>
      )}

      {/* 2x2 Grid of the 4 Quadrants */}
      <div className="relative z-10 grid grid-cols-2 grid-rows-2 w-full h-full">
        
        {/* QUADRANT 1: TOP-LEFT (Attendee Badge 1 / Front) */}
        <div className="flex items-center justify-center p-3 sm:p-5 relative">
          {renderBadgeCard("front")}
        </div>

        {/* QUADRANT 2: TOP-RIGHT (Attendee Badge 2 / Back) */}
        <div className="flex items-center justify-center p-3 sm:p-5 relative">
          {renderBadgeCard("back")}
        </div>

        {/* QUADRANT 3: BOTTOM-LEFT (Template / Fold Section) */}
        <div className="flex flex-col items-center justify-end p-4 text-center opacity-70">
          {!templateUrl && (
            <div className="text-[8px] text-slate-400 font-medium">
              Eventzone A4 4-Fold Badge Sheet
            </div>
          )}
        </div>

        {/* QUADRANT 4: BOTTOM-RIGHT (Template / Fold Section) */}
        <div className="flex flex-col items-center justify-end p-4 text-center opacity-70">
          {!templateUrl && (
            <div className="text-[8px] text-slate-400 font-medium">
              Fold along guidelines for badge pouch
            </div>
          )}
        </div>
      </div>

      {/* CENTER FOLD / CUT CROSSHAIR GUIDELINES */}
      {showFoldGuide && (
        <>
          {/* Vertical Center Fold Line */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0 border-r-2 border-dashed border-slate-400/50 pointer-events-none z-20" />
          
          {/* Horizontal Center Fold Line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0 border-b-2 border-dashed border-slate-400/50 pointer-events-none z-20" />
          
          {/* Center Fold Intersection Marker */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-[7px] font-bold uppercase tracking-wider backdrop-blur-xs flex items-center gap-1 z-30 pointer-events-none shadow-xs">
            <Scissors size={8} />
            <span>Fold Lines</span>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Helper function to trigger high-precision A4 browser print / PDF export
 */
export function printA4BadgeDocument({
  templateUrl = "",
  attendeeName = "Attendee",
  attendeePhoto = "",
  attendeeCompany = "",
  attendeeJobTitle = "",
  ticketType = "Standard Pass",
  badgeCode = "EZ-PASS",
  eventTitle = "Event",
  qrCodeUrl = "",
  showFoldGuide = true,
  showPhoto = true,
  showQr = true,
  cardTheme = "white",
}) {
  if (typeof window === "undefined") return;

  const isVip = (ticketType || "").toLowerCase().includes("vip");
  const cardBgStyle = cardTheme === "glass" 
    ? "background: rgba(255, 255, 255, 0.88); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.6); box-shadow: 0 4px 12px rgba(0,0,0,0.08);" 
    : "background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.06);";

  const cardHtml = `
    <div style="width: 78mm; min-height: 105mm; ${cardBgStyle} border-radius: 14px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between; align-items: center; text-align: center; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Card Header -->
      <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
        <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 8px; border-radius: 12px; ${isVip ? 'background: #fef3c7; color: #78350f; border: 1px solid #fde68a;' : 'background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;'}">
          ${ticketType || "General Pass"}
        </span>
        <span style="font-size: 8px; font-weight: 700; color: #64748b;">${eventTitle}</span>
      </div>

      <!-- Card Body -->
      <div style="margin: auto 0; padding: 8px 0; display: flex; flex-direction: column; align-items: center;">
        ${showPhoto ? `
          <div style="width: 54px; height: 54px; border-radius: 50%; overflow: hidden; border: 2px solid ${isVip ? '#d97706' : '#2563eb'}; margin-bottom: 8px; background: #f8fafc; display: flex; align-items: center; justify-content: center;">
            ${attendeePhoto 
              ? `<img src="${attendeePhoto}" style="width: 100%; height: 100%; object-fit: cover;" />` 
              : `<div style="width: 100%; height: 100%; background: #2563eb; color: #fff; font-weight: 900; font-size: 16px; display: flex; align-items: center; justify-content: center;">${(attendeeName || "A").slice(0, 2).toUpperCase()}</div>`
            }
          </div>
        ` : ''}

        <div style="font-size: 16px; font-weight: 900; color: #0f172a; line-height: 1.1; margin-bottom: 3px;">
          ${attendeeName || "Attendee Name"}
        </div>
        ${attendeeJobTitle ? `
          <div style="font-size: 10px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">
            ${attendeeJobTitle}
          </div>
        ` : ''}
        <div style="font-size: 11px; font-weight: 600; color: #475569;">
          ${attendeeCompany || ""}
        </div>
      </div>

      <!-- Card Footer with QR -->
      ${showQr ? `
        <div style="width: 100%; border-top: 1px solid #f1f5f9; padding-top: 8px; display: flex; justify-content: space-between; align-items: center;">
          <div style="text-align: left;">
            <div style="font-size: 7.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Badge ID</div>
            <div style="font-size: 11px; font-weight: 900; font-family: monospace; color: #0f172a;">${badgeCode || "EZ-PASS"}</div>
          </div>
          ${qrCodeUrl ? `
            <div style="width: 44px; height: 44px; padding: 2px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;">
              <img src="${qrCodeUrl}" style="width: 100%; height: 100%; object-fit: contain;" />
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;

  const printWindow = window.open("", "_blank", "width=850,height=1100");
  if (!printWindow) {
    alert("Please allow popups to print the A4 badge sheet.");
    return;
  }

  const printHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>A4 Badge Sheet - ${attendeeName}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0;
            padding: 0;
            width: 210mm;
            height: 297mm;
            background: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .a4-sheet {
            position: relative;
            width: 210mm;
            height: 297mm;
            ${templateUrl ? `background-image: url('${templateUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat;` : 'background: #ffffff;'}
            overflow: hidden;
          }
          .quadrants-grid {
            display: grid;
            grid-template-columns: 105mm 105mm;
            grid-template-rows: 148.5mm 148.5mm;
            width: 210mm;
            height: 297mm;
            position: relative;
            z-index: 10;
          }
          .quadrant {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10mm;
            box-sizing: border-box;
          }
          ${showFoldGuide ? `
            .fold-line-v {
              position: absolute;
              top: 0;
              bottom: 0;
              left: 105mm;
              width: 0;
              border-right: 1px dashed rgba(100, 116, 139, 0.45);
              z-index: 20;
            }
            .fold-line-h {
              position: absolute;
              left: 0;
              right: 0;
              top: 148.5mm;
              height: 0;
              border-bottom: 1px dashed rgba(100, 116, 139, 0.45);
              z-index: 20;
            }
            .fold-center-label {
              position: absolute;
              top: 148.5mm;
              left: 105mm;
              transform: translate(-50%, -50%);
              background: rgba(15, 23, 42, 0.85);
              color: #ffffff;
              font-size: 7px;
              font-weight: 800;
              text-transform: uppercase;
              padding: 2px 6px;
              border-radius: 10px;
              z-index: 30;
            }
          ` : ''}
        </style>
      </head>
      <body>
        <div class="a4-sheet">
          <div class="quadrants-grid">
            <!-- Top Left Quadrant -->
            <div class="quadrant">
              ${cardHtml}
            </div>
            <!-- Top Right Quadrant -->
            <div class="quadrant">
              ${cardHtml}
            </div>
            <!-- Bottom Left Quadrant -->
            <div class="quadrant"></div>
            <!-- Bottom Right Quadrant -->
            <div class="quadrant"></div>
          </div>

          ${showFoldGuide ? `
            <div class="fold-line-v"></div>
            <div class="fold-line-h"></div>
            <div class="fold-center-label">✂ Fold Guide</div>
          ` : ''}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(printHtml);
  printWindow.document.close();
}
