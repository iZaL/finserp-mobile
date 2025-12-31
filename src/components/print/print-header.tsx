/**
 * Print Header Component
 * Static company header for print layouts - bilingual (Arabic & English)
 */
export function PrintHeader() {
  return (
    <div className="print-header relative mb-3">
      {/* Logo - Absolute positioned top right */}
      <div className="absolute top-0 right-0">
        <div className="rounded border border-gray-400 bg-white px-3 py-1.5">
          <span className="text-lg font-semibold text-gray-700">
            Bluefin LLC
          </span>
        </div>
      </div>

      {/* Company Info - Centered */}
      <div className="border-b-2 border-gray-800 pb-2 text-center">
        {/* Arabic Name */}
        <h1 className="text-2xl leading-tight font-bold" dir="rtl">
          مصنع المنار لإنتاج مسحوق وزيت السمك ش.م.م
        </h1>
        {/* English Name */}
        <h2 className="text-lg font-semibold text-gray-800">
          AL MANAR FISH MEAL & OIL FACTORY L.L.C
        </h2>
        {/* Address - Combined */}
        <p className="text-base leading-tight text-gray-600">
          C.R: 1218121, P.O. Box: 3596, Postal Code: 111, OCP, Sultanate of Oman
        </p>
      </div>
    </div>
  );
}
