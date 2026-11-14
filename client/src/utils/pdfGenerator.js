import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, getGrade } from './helpers';
import { DAYS, getScheduleForDay, calculateDayTimeline } from './timetableHelper';

// ── Helper: Convert number to English words ──────────────────────────────────
export const numberToWords = (n) => {
  const num = Math.floor(Math.abs(Number(n) || 0));
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  if (num === 0) return 'ZERO';
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
  if (num < 1000) return ones[Math.floor(num / 100)] + ' HUNDRED' + (num % 100 !== 0 ? ' ' + numberToWords(num % 100) : '');
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' THOUSAND' + (num % 1000 !== 0 ? ' ' + numberToWords(num % 1000) : '');
  return String(num);
};

// ── Helper: Convert date string to English words (e.g. 15th August 2011) ────
export const dateToWords = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const ords = ['', 'FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH', 'SIXTH', 'SEVENTH', 'EIGHTH', 'NINTH', 'TENTH',
    'ELEVENTH', 'TWELFTH', 'THIRTEENTH', 'FOURTEENTH', 'FIFTEENTH', 'SIXTEENTH', 'SEVENTEENTH', 'EIGHTEENTH', 'NINETEENTH', 'TWENTIETH',
    'TWENTY-FIRST', 'TWENTY-SECOND', 'TWENTY-THIRD', 'TWENTY-FOURTH', 'TWENTY-FIFTH', 'TWENTY-SIXTH', 'TWENTY-SEVENTH', 'TWENTY-EIGHTH', 'TWENTY-NINTH', 'THIRTIETH', 'THIRTY-FIRST'];
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  const day = d.getDate();
  const m = months[d.getMonth()];
  const y = d.getFullYear();
  return (ords[day] || String(day)) + ' ' + m + ' ' + numberToWords(y);
};

// ── Helper: Calculate Academic Division ──────────────────────────────────────
export const getDivision = (pct) => {
  const p = Number(pct || 0);
  if (p >= 75) return '1ST DIVISION (DISTINCTION)';
  if (p >= 60) return '1ST DIVISION';
  if (p >= 50) return '2ND DIVISION';
  if (p >= 40) return '3RD DIVISION';
  return 'NEEDS IMPROVEMENT';
};

// ── Helper: Determine Promoted Class ─────────────────────────────────────────
export const getPromotedClass = (currClass) => {
  if (!currClass) return 'PROMOTED TO NEXT HIGHER CLASS';
  const c = String(currClass).trim().toUpperCase();
  const numMatch = c.match(/\d+/);
  if (numMatch) {
    const num = parseInt(numMatch[0], 10);
    if (num >= 12) return 'PASSED SENIOR SECONDARY SCHOOL (GRADUATED)';
    if (num === 10) return 'CLASS 11TH (STREAM SELECTION)';
    const suffix = num + 1 === 1 ? 'ST' : num + 1 === 2 ? 'ND' : num + 1 === 3 ? 'RD' : 'TH';
    return `CLASS ${num + 1}${suffix}`;
  }
  return `NEXT HIGHER CLASS (${c})`;
};

// ── Helper: Load Admin Logo as Base64 Image ──────────────────────────────────
export const loadLogoBase64 = async (logoUrl) => {
  if (!logoUrl) return null;
  if (typeof window === 'undefined') return null;
  if (typeof logoUrl === 'string' && logoUrl.startsWith('data:image')) {
    return logoUrl;
  }
  try {
    return await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width || 300;
          canvas.height = img.height || 300;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      const fullUrl = logoUrl.startsWith('/') && window.location
        ? `${window.location.origin}${logoUrl}`
        : logoUrl;
      img.src = fullUrl;
    });
  } catch (e) {
    return null;
  }
};

export const loadPhotoBase64 = loadLogoBase64;

// ── Helper: Draw Decorative Colored Pencils Along Top Border ─────────────────
const drawTopPencils = (doc, startX, startY, totalWidth) => {
  const numPencils = 36;
  const pWidth = totalWidth / numPencils;
  const shaftHeight = 3.6;
  const tipHeight = 2.0;
  const palette = [
    [239, 68, 68],   // Red
    [249, 115, 22],  // Orange
    [234, 179, 8],   // Yellow
    [34, 197, 94],   // Green
    [14, 165, 233],  // Sky
    [37, 99, 235],   // Blue
    [79, 70, 229],   // Indigo
    [168, 85, 247],  // Purple
    [236, 72, 153],  // Pink
    [20, 184, 166],  // Teal
    [245, 158, 11],  // Amber
    [30, 64, 175],   // Royal Navy
  ];

  for (let i = 0; i < numPencils; i++) {
    const px = startX + i * pWidth;
    const color = palette[i % palette.length];

    // Colored shaft
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(px, startY, pWidth, shaftHeight, 'F');

    // Wood body triangle
    doc.setFillColor(254, 240, 138); // light wood
    doc.triangle(px, startY + shaftHeight, px + pWidth, startY + shaftHeight, px + pWidth / 2, startY + shaftHeight + tipHeight, 'F');

    // Graphite lead tip
    doc.setFillColor(color[0], color[1], color[2]);
    doc.triangle(px + pWidth * 0.25, startY + shaftHeight + tipHeight * 0.5, px + pWidth * 0.75, startY + shaftHeight + tipHeight * 0.5, px + pWidth / 2, startY + shaftHeight + tipHeight, 'F');

    // Fine divider line
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.1);
    doc.line(px, startY, px, startY + shaftHeight);
  }
};

// ── Helper: Draw Circular Official Cambridge Crest / Seal ────────────────────
const drawOfficialSeal = (doc, cx, cy, radius, estdYear = '') => {
  // Outer Royal Blue circle
  doc.setFillColor(26, 54, 138);
  doc.circle(cx, cy, radius, 'F');

  // Golden Yellow border
  doc.setDrawColor(245, 175, 20);
  doc.setLineWidth(0.7);
  doc.circle(cx, cy, radius - 0.8, 'S');

  // Inner Deep Navy circle
  doc.setFillColor(10, 18, 42);
  doc.circle(cx, cy, radius - 2.2, 'F');

  // Monogram & text
  doc.setTextColor(250, 204, 21); // Gold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('ICS', cx, cy - (estdYear ? 0.4 : -2.5), { align: 'center' });

  if (estdYear) {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(4.8);
    doc.text(`ESTD. ${estdYear}`, cx, cy + 3.8, { align: 'center' });
  }
};

// ── Helper: Draw Student Photograph Box (Right Side) ─────────────────────────
const drawStudentPhoto = (doc, x, y, w, h, photoBase64, studentName = '') => {
  // Outer frame
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, h, 1, 1, 'FD');
  doc.setDrawColor(26, 54, 138); // Royal blue border
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, w, h, 1, 1, 'S');

  if (photoBase64) {
    try {
      doc.addImage(photoBase64, 'JPEG', x + 0.8, y + 0.8, w - 1.6, h - 1.6);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.rect(x + 0.8, y + 0.8, w - 1.6, h - 1.6, 'S');
    } catch (e) {
      drawPhotoPlaceholder(doc, x, y, w, h, studentName);
    }
  } else {
    drawPhotoPlaceholder(doc, x, y, w, h, studentName);
  }

  // Label underneath
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('STUDENT PHOTOGRAPH', x + w / 2, y + h + 2.8, { align: 'center' });
};

// ── Helper: Draw Student Photo Placeholder Box ───────────────────────────────
const drawPhotoPlaceholder = (doc, x, y, w, h, studentName = '') => {
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x + 0.8, y + 0.8, w - 1.6, h - 1.6, 1, 1, 'F');

  doc.setDrawColor(180, 195, 215);
  doc.setLineWidth(0.3);
  doc.rect(x + 2, y + 2, w - 4, h - 4, 'S');

  const cx = x + w / 2;
  const cy = y + h / 2 - 3;
  doc.setFillColor(215, 228, 245);
  // Head
  doc.circle(cx, cy - 3.5, 4.5, 'F');
  // Torso / shoulders
  doc.roundedRect(cx - 7.5, cy + 2.5, 15, 8.5, 2.5, 2.5, 'F');

  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(140, 160, 190);
  doc.text('AFFIX', cx, cy + 13.5, { align: 'center' });
  doc.text('PASSPORT PHOTO', cx, cy + 16.5, { align: 'center' });
};

// ── Helper: Draw Faint Background Watermark with School Logo or Emblem ────────
const drawWatermark = (doc, cx, cy, radius, logoBase64 = null, schoolName = 'INTERNATIONAL CAMBRIDGE PUBLIC SCHOOL', location = 'KISHTWAR • JAMMU & KASHMIR', estd = '') => {
  if (logoBase64) {
    try {
      const wmSize = 80; // 80mm x 80mm centered faint watermark
      const wmX = cx - wmSize / 2;
      const wmY = cy - wmSize / 2;
      if (typeof doc.saveGraphicsState === 'function' && typeof doc.setGState === 'function' && doc.GState) {
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.08 }));
        doc.addImage(logoBase64, 'PNG', wmX, wmY, wmSize, wmSize);
        doc.restoreGraphicsState();
        return;
      } else {
        doc.addImage(logoBase64, 'PNG', wmX, wmY, wmSize, wmSize);
        return;
      }
    } catch (e) {
      console.warn('[PDF] Watermark logo render fallback:', e.message);
    }
  }

  doc.setDrawColor(226, 235, 248);
  doc.setLineWidth(0.4);
  doc.circle(cx, cy, radius, 'S');
  doc.circle(cx, cy, radius - 4.5, 'S');

  // Open Book Vector Icon in center of watermark
  const bookY = cy - 8;
  doc.setLineWidth(0.35);
  // Left Page
  doc.line(cx, bookY + 5, cx - 7, bookY + 3.5);
  doc.line(cx - 7, bookY + 3.5, cx - 7, bookY - 3.5);
  doc.line(cx - 7, bookY - 3.5, cx, bookY - 1.5);
  doc.line(cx, bookY - 1.5, cx, bookY + 5);
  // Right Page
  doc.line(cx, bookY + 5, cx + 7, bookY + 3.5);
  doc.line(cx + 7, bookY + 3.5, cx + 7, bookY - 3.5);
  doc.line(cx + 7, bookY - 3.5, cx, bookY - 1.5);
  // Page ribs
  doc.line(cx - 6, bookY - 1, cx - 1, bookY + 0.5);
  doc.line(cx + 1, bookY + 0.5, cx + 6, bookY - 1);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(220, 230, 245);
  doc.text(schoolName.toUpperCase(), cx, cy - 13, { align: 'center' });

  doc.setFontSize(7.5);
  doc.text(location.toUpperCase(), cx, cy + 9, { align: 'center' });

  if (estd) {
    doc.setFontSize(7);
    doc.text(`★  ESTD. ${estd}  ★`, cx, cy + 15, { align: 'center' });
  }
};

// ── Core Function: Render CBSE/State Style Marksheet Cum Certificate Page ────
export const renderCertificateMarksheetPage = async (doc, {
  student,
  result,
  academics,
  attendance,
  settings = {},
  isConsolidated = false,
  logoBase64 = null,
  studentPhotoBase64 = null,
}) => {
  const stu = result?.student || student || {};
  const schoolName = (settings?.school_name || 'INTERNATIONAL CAMBRIDGE PUBLIC SCHOOL KISHTWAR').toUpperCase();
  const schoolSub = (settings?.school_subtitle || settings?.school_address || 'KISHTWAR, JAMMU & KASHMIR').toUpperCase();
  const schoolAddress = (settings?.school_address || 'KISHTWAR, JAMMU & KASHMIR').toUpperCase();
  const diseNo = settings?.dise_code || settings?.dice_no || settings?.udise_no || settings?.school_id || '';
  const estdYear = settings?.school_established || settings?.establishment_date || '';
  const schoolMedium = (settings?.school_medium || 'ENGLISH MEDIUM').toUpperCase();

  // 1. Triple Decorative Frame (Royal Blue & Cambridge Yellow)
  // Outer Royal Blue Frame
  doc.setDrawColor(26, 54, 138); // #1a368a
  doc.setLineWidth(1.2);
  doc.rect(6, 6, 198, 285, 'S');

  // Middle Golden Yellow Frame
  doc.setDrawColor(245, 175, 20); // #f5af14
  doc.setLineWidth(1.0);
  doc.rect(7.6, 7.6, 194.8, 281.8, 'S');

  // Inner Deep Navy Pinstripe
  doc.setDrawColor(15, 23, 42); // #0f172a
  doc.setLineWidth(0.3);
  doc.rect(9.2, 9.2, 191.6, 278.6, 'S');

  // 2. Top Decorative Colored Pencil Border
  drawTopPencils(doc, 9.4, 9.4, 191.2);

  // 3. ESTD and DISE NO. (Top Header Meta - Only printed if filled by admin)
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  if (estdYear) {
    doc.text(`ESTD. ${estdYear}`, 13, 18.5);
  }
  if (diseNo) {
    doc.text(`DICE NO. : ${diseNo}`, 197, 18.5, { align: 'right' });
  }

  // 4. School Logo on Left Side (Custom uploaded logo or official circular crest)
  const logoX = 13;
  const logoY = estdYear ? 20.0 : 18.5;
  const logoW = 22;
  const logoH = 22;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoW, logoH);
    } catch (e) {
      drawOfficialSeal(doc, logoX + logoW / 2, logoY + logoH / 2, 10, estdYear);
    }
  } else {
    drawOfficialSeal(doc, logoX + logoW / 2, logoY + logoH / 2, 10, estdYear);
  }

  // 5. School Name Header (Crimson Red, Centered with dynamic scaling to NEVER overlap logo)
  const centerX = 105; // Perfect A4 horizontal center
  const maxTitleW = 126; // Ensures text stays between x = 42 and x = 168 (safe from logo at x = 35)
  let nameFontSize = 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(nameFontSize);
  while (doc.getTextWidth(schoolName) > maxTitleW && nameFontSize > 9) {
    nameFontSize -= 0.5;
    doc.setFontSize(nameFontSize);
  }
  doc.setTextColor(185, 28, 28);
  doc.text(schoolName, centerX, 26.5, { align: 'center' });

  // 6. [ ENGLISH MEDIUM ] Pill Box
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  const mediumTextW = doc.getTextWidth(schoolMedium);
  const pillW = Math.max(38, mediumTextW + 10);
  const pillH = 4.6;
  const pillX = centerX - pillW / 2;
  const pillY = 30.5;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(26, 54, 138);
  doc.setLineWidth(0.35);
  doc.roundedRect(pillX, pillY, pillW, pillH, 1.5, 1.5, 'FD');

  doc.setTextColor(26, 54, 138);
  doc.text(schoolMedium, centerX, pillY + 3.3, { align: 'center' });

  // 7. Location Line
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolSub, centerX, 39.5, { align: 'center' });

  // 8. Document Title & Session (Tailored to exam type)
  const exType = String(result?.exam_type || '').toLowerCase();
  const exName = String(result?.exam_name || '').trim().toUpperCase();

  const isUnitTest = exType === 'unit_test' || exName.includes('UNIT') || exName.includes('PERIODIC') || exName.includes('PT-') || exName.includes('UT-');
  const isClassTest = exType === 'class_test' || exType === 'assessment' || exName.includes('CLASS TEST') || exName.includes('WEEKLY') || exName.includes('MONTHLY');
  const isHalfYearly = exType === 'half_yearly' || exType === 'pre_board' || exName.includes('HALF') || exName.includes('MID') || exName.includes('TERM 1') || exName.includes('TERM 2');
  const isAnnual = isConsolidated || (!isUnitTest && !isClassTest && !isHalfYearly);

  let titleText = 'ANNUAL CONSOLIDATED MARKSHEET CUM CERTIFICATE';
  if (settings?.marksheet_title) {
    titleText = settings.marksheet_title.toUpperCase();
  } else if (isUnitTest) {
    titleText = exName ? `${exName} REPORT CARD` : 'PERIODIC UNIT TEST REPORT CARD';
  } else if (isClassTest) {
    titleText = exName ? `${exName} REPORT` : 'CLASS TEST & CONTINUOUS ASSESSMENT REPORT';
  } else if (isHalfYearly) {
    titleText = exName ? `${exName} PERFORMANCE REPORT` : 'HALF YEARLY EXAMINATION PERFORMANCE REPORT';
  } else if (exName) {
    titleText = `${exName} MARKSHEET CUM CERTIFICATE`;
  }

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.text(titleText, centerX, 46.5, { align: 'center' });

  const sessionName = stu?.session?.name || result?.session_name || result?.session?.name || settings?.academic_session || '—';
  doc.setFontSize(8.5);
  doc.text(`SESSION : ${sessionName}`, centerX, 51.5, { align: 'center' });

  // 9. Faint Center Watermark (Drawn in background before tables/text)
  drawWatermark(doc, 105, 160, 38, logoBase64, schoolName, schoolSub, estdYear);

  // 10. Student Bio-Data Block (Clean dotted biodata lines with NO table for Class and Roll No)
  const bioY = 56.5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('CERTIFIED THAT', 11, bioY + 2.0);

  const stuFullName = `${stu?.first_name || ''} ${stu?.last_name || ''}`.trim().toUpperCase() || '—';
  const fatherName = stu?.parent_name ? String(stu.parent_name).toUpperCase() : (stu?.father_name ? String(stu.father_name).toUpperCase() : '—');
  const motherName = stu?.mother_name ? String(stu.mother_name).toUpperCase() : '—';
  const dobFormatted = stu?.date_of_birth ? formatDate(stu.date_of_birth) : '—';
  const dobWords = stu?.date_of_birth ? dateToWords(stu.date_of_birth) : '—';
  const sClass = String(result?.class || student?.class || '1ST').toUpperCase();
  const sRoll = String(result?.roll_number != null ? result.roll_number : (student?.roll_number != null ? student.roll_number : '1'));

  const bioFields = [
    { label: "STUDENT'S NAME  :", val: stuFullName },
    { label: "FATHER'S NAME   :", val: fatherName },
    { label: "MOTHER'S NAME   :", val: motherName },
    { isTwoCol: true, label1: "CLASS           :", val1: sClass, label2: "ROLL NO. :", val2: sRoll },
    { label: "DATE OF BIRTH   :", val: dobFormatted },
    { label: "DOB (IN WORD)   :", val: dobWords },
  ];

  const dotLineEnd = 146;
  bioFields.forEach((field, i) => {
    const fy = bioY + 6.6 + i * 5.4;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    if (field.isTwoCol) {
      doc.text(field.label1, 11, fy);
      doc.text(field.val1, 42, fy);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(170, 170, 170);
      const textW1 = doc.getTextWidth(field.val1);
      const dotStart1 = Math.min(42 + textW1 + 2, 85);
      const dotLen1 = Math.max(3, Math.floor((88 - dotStart1) / 1.4));
      if (dotLen1 > 0) doc.text('.'.repeat(dotLen1), dotStart1, fy);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(field.label2, 92, fy);
      doc.text(field.val2, 110, fy);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(170, 170, 170);
      const textW2 = doc.getTextWidth(field.val2);
      const dotStart2 = Math.min(110 + textW2 + 2, dotLineEnd - 10);
      const dotLen2 = Math.max(3, Math.floor((dotLineEnd - dotStart2) / 1.4));
      if (dotLen2 > 0) doc.text('.'.repeat(dotLen2), dotStart2, fy);
    } else {
      doc.text(field.label, 11, fy);
      doc.text(field.val, 42, fy);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(170, 170, 170);
      const textW = doc.getTextWidth(field.val);
      const dotStartX = Math.min(42 + textW + 2, dotLineEnd - 10);
      const dotLength = Math.max(5, Math.floor((dotLineEnd - dotStartX) / 1.4));
      doc.text('.'.repeat(dotLength), dotStartX, fy);
    }
  });

  // 11. Right Side Official Student Photograph
  const photoX = 153;
  const photoY = 56.5;
  const photoW = 34;
  const photoH = 41;
  drawStudentPhoto(doc, photoX, photoY, photoW, photoH, studentPhotoBase64, stuFullName);

  // 12. Subjects Data Extraction (Strictly assigned marks — NO ghost blank rows!)
  let studentSubjects = [];
  if (result?.subjects?.length > 0) {
    studentSubjects = result.subjects.map(s => {
      const maxM = Number(s.max_marks || 100);
      const minM = s.min_marks != null ? Number(s.min_marks) : Math.round(maxM * 0.33);
      const obtM = s.obtained_marks != null ? Number(s.obtained_marks) : 0;
      return {
        subject: String(s.subject).toUpperCase(),
        max_marks: maxM,
        min_marks: minM,
        obtained_marks: obtM,
        grade: s.grade || getGrade(obtM, maxM),
      };
    });
  } else if (result?.subject && result?.marks_obtained != null) {
    const maxM = Number(result.max_marks || 100);
    const minM = result.min_marks != null ? Number(result.min_marks) : Math.round(maxM * 0.33);
    const obtM = Number(result.marks_obtained);
    studentSubjects = [{
      subject: String(result.subject).toUpperCase(),
      max_marks: maxM,
      min_marks: minM,
      obtained_marks: obtM,
      grade: result.grade || getGrade(obtM, maxM),
    }];
  } else if (academics?.subject_breakdown?.length > 0) {
    studentSubjects = academics.subject_breakdown.map(s => ({
      subject: String(s.subject).toUpperCase(),
      max_marks: Number(s.total_max || 100),
      min_marks: Math.round(Number(s.total_max || 100) * 0.33),
      obtained_marks: s.total_obtained != null ? Number(s.total_obtained) : Math.round((Number(s.average_percentage || 0) / 100) * (s.total_max || 100)),
      grade: s.grade || getGrade(s.total_obtained || s.average_percentage, s.total_max || 100),
    }));
  }

  const hasRealSubjects = studentSubjects.length > 0;
  const realAtt = attendance || result?.attendance || stu?.attendance || null;
  const attPct = realAtt?.percentage != null ? Number(realAtt.percentage) : null;
  const regGrade = attPct != null ? (attPct >= 90 ? 'A+' : attPct >= 80 ? 'A' : attPct >= 70 ? 'B+' : attPct >= 60 ? 'B' : attPct >= 40 ? 'C' : 'D') : 'A';

  const defaultCoActivities = [
    { name: 'COMPUTER & G.K.', grade: 'A+' },
    { name: 'REGULARITY', grade: regGrade },
    { name: 'YOGA ACTIVITIES', grade: 'A+' },
    { name: 'BEHAVIOUR & COMPASSION', grade: 'A+' },
    { name: 'RESPECTFUL AND COURTEOUS', grade: 'A+' },
    { name: 'DISCIPLINE', grade: 'A' },
    { name: 'ARTS & CRAFT', grade: 'A' },
  ];

  const coActivities = result?.co_scholastic?.length > 0
    ? result.co_scholastic
    : (settings?.co_scholastic_qualities || defaultCoActivities);

  const tableY = 101.5;

  // ═══════════════════════════════════════════════════════════════════════════
  // FORMAT A: UNIT TEST / CLASS TEST / PERIODIC ASSESSMENT (Single Wide Table)
  // ═══════════════════════════════════════════════════════════════════════════
  if (isUnitTest || isClassTest) {
    const tableW = 188;
    const headerTitle = isUnitTest ? 'PERIODIC UNIT TEST EVALUATION' : 'CLASS TEST & CONTINUOUS ASSESSMENT';

    doc.setFillColor(248, 250, 252);
    doc.rect(11, tableY, tableW, 5.2, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.25);
    doc.rect(11, tableY, tableW, 5.2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(headerTitle, 11 + tableW / 2, tableY + 3.7, { align: 'center' });

    const testCols = [
      { title: 'S.NO.', w: 14, align: 'center' },
      { title: 'SUBJECT NAME', w: 64, align: 'left' },
      { title: 'MAX MARKS', w: 26, align: 'center' },
      { title: 'MIN PASS', w: 24, align: 'center' },
      { title: 'MARKS OBT.', w: 26, align: 'center' },
      { title: 'PERCENTAGE', w: 20, align: 'center' },
      { title: 'GRADE', w: 14, align: 'center' },
    ];

    doc.setFillColor(255, 255, 255);
    doc.rect(11, tableY + 5.2, tableW, 5.8, 'FD');
    let sx = 11;
    testCols.forEach((col, idx) => {
      if (idx > 0) doc.line(sx, tableY + 5.2, sx, tableY + 11.0);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      const tx = col.align === 'left' ? sx + 3 : sx + col.w / 2;
      doc.text(col.title, tx, tableY + 9.0, { align: col.align });
      sx += col.w;
    });

    // RENDER ONLY THE ASSIGNED SUBJECTS — ZERO BLANK PADDING ROWS!
    const numRows = Math.max(studentSubjects.length, 1);
    const rowH = 7.0;
    const dataStartY = tableY + 11.0;

    let grandMax = 0;
    let grandMin = 0;
    let grandObt = 0;

    for (let r = 0; r < numRows; r++) {
      const ry = dataStartY + r * rowH;
      const sub = studentSubjects[r];

      doc.rect(11, ry, tableW, rowH, 'S');
      let lx = 11;
      testCols.forEach((col, idx) => {
        if (idx > 0) doc.line(lx, ry, lx, ry + rowH);
        lx += col.w;
      });

      if (sub) {
        grandMax += sub.max_marks;
        grandMin += sub.min_marks;
        grandObt += sub.obtained_marks;
        const subPct = sub.max_marks > 0 ? ((sub.obtained_marks / sub.max_marks) * 100).toFixed(1) + '%' : '—';

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(String(r + 1), 11 + 7, ry + 4.8, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.text(sub.subject, 11 + 14 + 3, ry + 4.8);

        doc.setFont('helvetica', 'normal');
        doc.text(String(sub.max_marks), 11 + 14 + 64 + 13, ry + 4.8, { align: 'center' });
        doc.text(String(sub.min_marks), 11 + 14 + 64 + 26 + 12, ry + 4.8, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.text(String(sub.obtained_marks), 11 + 14 + 64 + 26 + 24 + 13, ry + 4.8, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text(subPct, 11 + 14 + 64 + 26 + 24 + 26 + 10, ry + 4.8, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.text(sub.grade, 11 + 14 + 64 + 26 + 24 + 26 + 20 + 7, ry + 4.8, { align: 'center' });
      } else {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text('NO EXAMINATION MARKS RECORDED IN DATABASE', 11 + 25, ry + 4.8);
      }
    }

    // Grand Total Row
    const totalRowY = dataStartY + numRows * rowH;
    const totalRowH = 7.0;
    doc.setFillColor(248, 250, 252);
    doc.rect(11, totalRowY, tableW, totalRowH, 'FD');
    let lx = 11;
    testCols.forEach((col, idx) => {
      if (idx > 0) doc.line(lx, totalRowY, lx, totalRowY + totalRowH);
      lx += col.w;
    });

    const finalPct = grandMax > 0
      ? ((grandObt / grandMax) * 100).toFixed(2)
      : (result?.percentage != null ? Number(result.percentage).toFixed(2) : '0.00');
    const finalGrade = hasRealSubjects && grandMax > 0
      ? (result?.grade || getGrade(grandObt, grandMax))
      : (result?.grade || '—');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('TOTAL', 11 + 7, totalRowY + 4.8, { align: 'center' });
    doc.text('AGGREGATE PERFORMANCE', 11 + 14 + 3, totalRowY + 4.8);
    doc.text(hasRealSubjects ? String(grandMax) : '—', 11 + 14 + 64 + 13, totalRowY + 4.8, { align: 'center' });
    doc.text(hasRealSubjects ? String(grandMin) : '—', 11 + 14 + 64 + 26 + 12, totalRowY + 4.8, { align: 'center' });
    doc.text(hasRealSubjects ? String(grandObt) : '—', 11 + 14 + 64 + 26 + 24 + 13, totalRowY + 4.8, { align: 'center' });
    doc.text(hasRealSubjects ? `${finalPct}%` : '—', 11 + 14 + 64 + 26 + 24 + 26 + 10, totalRowY + 4.8, { align: 'center' });
    doc.text(finalGrade, 11 + 14 + 64 + 26 + 24 + 26 + 20 + 7, totalRowY + 4.8, { align: 'center' });

    // Unit Test / Class Test KPI Score Badges Strip
    const kpiY = totalRowY + totalRowH + 6;
    const kpiW = 44;
    const kpiH = 14;
    const kpiGap = 4;
    const kpiList = [
      { label: 'SCORE OBTAINED', val: `${grandObt} / ${grandMax}` },
      { label: 'PERCENTAGE', val: `${finalPct}%` },
      { label: 'OVERALL GRADE', val: finalGrade },
      { label: 'CLASS RANK', val: result?.rank ? `#${result.rank} IN CLASS` : '1ST IN CLASS' },
    ];

    kpiList.forEach((kpi, idx) => {
      const kx = 11 + idx * (kpiW + kpiGap);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(kx, kpiY, kpiW, kpiH, 1.5, 1.5, 'FD');

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label, kx + kpiW / 2, kpiY + 4.8, { align: 'center' });

      doc.setFontSize(9.5);
      doc.setTextColor(30, 64, 175);
      doc.text(kpi.val, kx + kpiW / 2, kpiY + 10.8, { align: 'center' });
    });

    // Performance Note & Feedback Box
    const noteY = kpiY + kpiH + 6;
    const noteH = 22;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(11, noteY, tableW, noteH, 1.5, 1.5, 'S');

    const isPassed = hasRealSubjects && Number(finalPct) >= 33;
    const perfRemark = isPassed
      ? (Number(finalPct) >= 85 ? 'OUTSTANDING PERFORMANCE & CONCEPTUAL MASTERY' : Number(finalPct) >= 70 ? 'COMMENDABLE PERFORMANCE — CONSISTENT PROGRESS' : 'SATISFACTORY EFFORT — ENCOURAGED TO REVISE CORE CONCEPTS')
      : 'NEEDS GUIDANCE & REGULAR PRACTICE IN WEAK AREAS';

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('RESULT STATUS :', 15, noteY + 5.5);
    doc.setTextColor(30, 64, 175);
    doc.text(isPassed ? 'PASSED / QUALIFIED' : 'NEEDS IMPROVEMENT', 45, noteY + 5.5);

    doc.setTextColor(15, 23, 42);
    doc.text('EVALUATION NOTE :', 15, noteY + 11.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(perfRemark, 45, noteY + 11.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('ATTENDANCE STATUS :', 15, noteY + 17.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(attPct != null ? `${attPct}% Attendance recorded for this testing period.` : 'Regular student attendance recorded.', 50, noteY + 17.5);

    // Signatures (Subject Teacher, Class Teacher, Parent)
    const sigY = 268;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);

    doc.text('.'.repeat(30), 16, sigY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text("SUBJECT TEACHER'S SIGNATURE", 16, sigY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('.'.repeat(30), 85, sigY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text("CLASS TEACHER'S SIGNATURE", 85, sigY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('.'.repeat(30), 152, sigY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text("PARENT / GUARDIAN'S SIGNATURE", 152, sigY + 5);

  } else {
    // ═════════════════════════════════════════════════════════════════════════
    // FORMAT B: ANNUAL / CONSOLIDATED OR HALF-YEARLY (Side-by-Side Dual Table)
    // ═════════════════════════════════════════════════════════════════════════
    const leftTableW = 115;
    const rightTableW = 73;

    // Left Table Header
    doc.setFillColor(248, 250, 252);
    doc.rect(11, tableY, leftTableW, 5.2, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.25);
    doc.rect(11, tableY, leftTableW, 5.2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(isHalfYearly ? 'ACADEMIC SUBJECTS' : 'MAIN SUBJECT', 11 + leftTableW / 2, tableY + 3.7, { align: 'center' });

    const maxMarksHeader = isHalfYearly ? 'MAX.\nMARKS' : 'MAX. MARKS\n(CCE+TE)';
    const subCols = [
      { title: 'DETAILS', w: 44, align: 'left' },
      { title: maxMarksHeader, w: 26, align: 'center', twoLines: true },
      { title: 'MIN\nMARKS', w: 17, align: 'center', twoLines: true },
      { title: 'MARKS\nOBT.', w: 16, align: 'center', twoLines: true },
      { title: 'GRADE', w: 12, align: 'center' },
    ];

    doc.setFillColor(255, 255, 255);
    doc.rect(11, tableY + 5.2, leftTableW, 5.8, 'FD');
    let sx = 11;
    subCols.forEach((col, idx) => {
      if (idx > 0) doc.line(sx, tableY + 5.2, sx, tableY + 11.0);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      if (col.twoLines) {
        const parts = col.title.split('\n');
        doc.text(parts[0], sx + col.w / 2, tableY + 7.6, { align: 'center' });
        doc.text(parts[1], sx + col.w / 2, tableY + 10.1, { align: 'center' });
      } else {
        const tx = col.align === 'left' ? sx + 3 : sx + col.w / 2;
        doc.text(col.title, tx, tableY + 8.8, { align: col.align });
      }
      sx += col.w;
    });

    // Right Table Header
    doc.setFillColor(248, 250, 252);
    doc.rect(126, tableY, rightTableW, 5.2, 'F');
    doc.rect(126, tableY, rightTableW, 5.2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(isHalfYearly ? 'TERM ATTRIBUTES & CONDUCT' : 'PERSONAL & SOCIAL QUALITIES', 126 + rightTableW / 2, tableY + 3.7, { align: 'center' });

    const coCols = [
      { title: 'SUBJECT', w: 55, align: 'left' },
      { title: 'GRADE', w: 18, align: 'center' },
    ];

    doc.setFillColor(255, 255, 255);
    doc.rect(126, tableY + 5.2, rightTableW, 5.8, 'FD');
    sx = 126;
    coCols.forEach((col, idx) => {
      if (idx > 0) doc.line(sx, tableY + 5.2, sx, tableY + 11.0);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      const tx = col.align === 'left' ? sx + 3 : sx + col.w / 2;
      doc.text(col.title, tx, tableY + 8.8, { align: col.align });
      sx += col.w;
    });

    // DYNAMIC ROW COUNT: NEVER draw blank rows if only few subjects assigned
    const numRows = studentSubjects.length >= 4
      ? Math.max(studentSubjects.length, coActivities.length)
      : Math.max(studentSubjects.length, 1);

    const rowH = 6.2;
    const dataStartY = tableY + 11.0;

    let grandMax = 0;
    let grandMin = 0;
    let grandObt = 0;

    for (let r = 0; r < numRows; r++) {
      const ry = dataStartY + r * rowH;
      const sub = studentSubjects[r];
      const co = coActivities[r];

      // Left row border
      doc.rect(11, ry, leftTableW, rowH, 'S');
      let lx = 11;
      subCols.forEach((col, idx) => {
        if (idx > 0) doc.line(lx, ry, lx, ry + rowH);
        lx += col.w;
      });

      if (sub) {
        grandMax += sub.max_marks;
        grandMin += sub.min_marks;
        grandObt += sub.obtained_marks;

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(sub.subject, 11 + 3, ry + 4.3);

        doc.setFont('helvetica', 'normal');
        doc.text(String(sub.max_marks), 11 + 44 + 13, ry + 4.3, { align: 'center' });
        doc.text(String(sub.min_marks), 11 + 70 + 8.5, ry + 4.3, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.text(String(sub.obtained_marks), 11 + 87 + 8.0, ry + 4.3, { align: 'center' });
        doc.text(sub.grade, 11 + 103 + 6, ry + 4.3, { align: 'center' });
      } else if (!hasRealSubjects && r === 0) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text('NO EXAMINATION MARKS RECORDED IN DATABASE', 11 + 3, ry + 4.3);
        doc.text('—', 11 + 44 + 13, ry + 4.3, { align: 'center' });
        doc.text('—', 11 + 70 + 8.5, ry + 4.3, { align: 'center' });
        doc.text('—', 11 + 87 + 8.5, ry + 4.3, { align: 'center' });
        doc.text('—', 11 + 103 + 6, ry + 4.3, { align: 'center' });
      }

      // Right row border
      doc.rect(126, ry, rightTableW, rowH, 'S');
      doc.line(126 + 55, ry, 126 + 55, ry + rowH);

      if (co) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(co.name, 126 + 3, ry + 4.3);
        doc.text(co.grade, 126 + 55 + 9, ry + 4.3, { align: 'center' });
      }
    }

    // Grand Total Row
    const totalRowY = dataStartY + numRows * rowH;
    const totalRowH = 6.5;

    doc.setFillColor(248, 250, 252);
    doc.rect(11, totalRowY, leftTableW, totalRowH, 'FD');
    let lx = 11;
    subCols.forEach((col, idx) => {
      if (idx > 0) doc.line(lx, totalRowY, lx, totalRowY + totalRowH);
      lx += col.w;
    });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('GRAND TOTAL', 11 + 3, totalRowY + 4.6);
    doc.text(hasRealSubjects ? String(grandMax) : '—', 11 + 44 + 13, totalRowY + 4.6, { align: 'center' });
    doc.text(hasRealSubjects ? String(grandMin) : '—', 11 + 70 + 8.5, totalRowY + 4.6, { align: 'center' });
    doc.text(hasRealSubjects ? String(grandObt) : '—', 11 + 87 + 8.0, totalRowY + 4.6, { align: 'center' });

    const finalPct = grandMax > 0
      ? ((grandObt / grandMax) * 100).toFixed(2)
      : (result?.percentage != null ? Number(result.percentage).toFixed(2) : null);
    const finalGrade = hasRealSubjects && grandMax > 0
      ? (result?.grade || getGrade(grandObt, grandMax))
      : (result?.grade || '—');
    doc.text(finalGrade, 11 + 103 + 6, totalRowY + 4.6, { align: 'center' });

    // Right Total cell (shaded box)
    doc.setFillColor(248, 250, 252);
    doc.rect(126, totalRowY, rightTableW, totalRowH, 'FD');
    doc.line(126 + 55, totalRowY, 126 + 55, totalRowY + totalRowH);

    // Results & Standing Block
    const resBlockY = totalRowY + totalRowH + 6;
    const col1X = 12;
    const col2X = 106;

    const hasScore = hasRealSubjects && grandMax > 0;
    const isPassed = hasScore
      ? (studentSubjects.every(s => s.obtained_marks >= s.min_marks) && Number(finalPct || 0) >= 33)
      : (finalPct != null && Number(finalPct) >= 33);
    const finalDivision = finalPct != null ? getDivision(finalPct) : '—';
    const promotedTo = isAnnual
      ? (isPassed ? getPromotedClass(sClass) : (hasScore ? `HELD BACK IN ${sClass}` : '—'))
      : (settings?.midterm_promoted_label || 'NEXT ACADEMIC TERM (ON TRACK)');
    const rankStr = result?.rank
      ? `${result.rank}${result.rank === 1 ? 'ST' : result.rank === 2 ? 'ND' : result.rank === 3 ? 'RD' : 'TH'} IN CLASS`
      : '1ST IN CLASS';
    const schoolReopen = settings?.school_reopen_date || '01 APRIL 2025';
    const pctStr = finalPct != null ? `${finalPct}%` : '—';

    const resultStatus = !hasScore && finalPct == null
      ? 'RECORD AWAITED'
      : (isPassed ? (isAnnual ? 'PASSED & PROMOTED' : 'PASSED') : 'NEEDS IMPROVEMENT');

    const leftRes = [
      { label: 'RESULT', val: resultStatus },
      { label: 'DIVISION', val: finalDivision },
      { label: isAnnual ? 'PROMOTED TO CLASS' : 'ACADEMIC STATUS', val: isAnnual ? promotedTo : 'ON TRACK' },
    ];

    leftRes.forEach((item, idx) => {
      const iy = resBlockY + idx * 6.5;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`${item.label}`, col1X, iy);

      doc.setTextColor(30, 64, 175);
      doc.text(`: ${item.val}`, col1X + 42, iy);

      doc.setTextColor(180, 180, 180);
      doc.setFont('helvetica', 'normal');
      const valWidth = doc.getTextWidth(`: ${item.val}`);
      const dotStart = col1X + 42 + valWidth + 2;
      const dotLength = Math.max(0, Math.floor((102 - dotStart) / 1.5));
      if (dotLength > 0) doc.text('.'.repeat(dotLength), dotStart, iy);
    });

    const rightRes = [
      { label: 'PERCENTAGE', val: pctStr },
      { label: 'RANK', val: rankStr },
      { label: isAnnual ? 'SCHOOL REOPEN' : 'NEXT TERM', val: isAnnual ? `: ${schoolReopen}` : ': AS PER SCHEDULE' },
    ];

    rightRes.forEach((item, idx) => {
      const iy = resBlockY + idx * 6.5;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`${item.label}`, col2X, iy);

      doc.setTextColor(30, 64, 175);
      const prefix = item.val.startsWith(':') ? '' : ': ';
      doc.text(`${prefix}${item.val}`, col2X + 36, iy);

      doc.setTextColor(180, 180, 180);
      doc.setFont('helvetica', 'normal');
      const valWidth = doc.getTextWidth(`${prefix}${item.val}`);
      const dotStart = col2X + 36 + valWidth + 2;
      const dotLength = Math.max(0, Math.floor((198 - dotStart) / 1.5));
      if (dotLength > 0) doc.text('.'.repeat(dotLength), dotStart, iy);
    });

    // 15. Signatures Footer (Class Teacher, Exam Controller, Principal)
    const sigY = 268;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);

    doc.text('.'.repeat(30), 16, sigY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text("CLASS TEACHER'S SIGNATURE", 16, sigY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('.'.repeat(30), 85, sigY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('EXAM CONTROLLER / IN-CHARGE', 85, sigY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('.'.repeat(30), 152, sigY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text("PRINCIPAL'S SIGNATURE", 152, sigY + 5);
  }
};

// ── Report Card PDF (Official Marksheet Cum Certificate) ───────────────────────
export const generateReportCard = async (student, result, settings = {}, attendance = null) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const logoBase64 = await loadLogoBase64(settings?.school_logo_url);
  const stuPhotoUrl = student?.profile_photo || 
                      student?.photo_url || 
                      student?.photo || 
                      student?.avatar || 
                      result?.student?.profile_photo || 
                      result?.student?.photo_url;
  const studentPhotoBase64 = await loadPhotoBase64(stuPhotoUrl);

  const realStudent = result?.student || student || {};
  const realAttendance = attendance || result?.attendance || realStudent?.attendance || null;

  await renderCertificateMarksheetPage(doc, {
    student: realStudent,
    result,
    attendance: realAttendance,
    settings,
    isConsolidated: false,
    logoBase64,
    studentPhotoBase64,
  });

  const stuId = realStudent?.student_id || student?.student_id || student?.roll_number || 'student';
  const exName = (result?.exam_name || result?.exam_type || 'marksheet').replace(/\s+/g, '_');
  doc.save(`Marksheet_${stuId}_${exName}.pdf`);
};

// ── Fee Receipt PDF ───────────────────────────────────────────────────────────
export const generateFeeReceipt = async (fee, student, settings = {}) => {
  const doc = new jsPDF({ unit: 'mm', format: [148, 210] }); // A5
  const w = doc.internal.pageSize.width;

  const schoolName = settings.school_name || 'International Cambridge School Kishtwar';
  const schoolSub = settings.school_subtitle || '';
  const schoolAddress = settings.school_address || '';
  const schoolContact = [settings.school_phone, settings.school_email].filter(Boolean).join(' | ');
  const footerNote = settings.receipt_footer || 'This is a computer-generated receipt. No signature required.';

  // Attempt to load the logo if provided
  let logoBase64 = null;
  if (settings.school_logo_url) {
    logoBase64 = await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = settings.school_logo_url.startsWith('/') 
        ? `${window.location.origin}${settings.school_logo_url}` 
        : settings.school_logo_url;
    });
  }

  let startY = 15;
  if (logoBase64) {
    // Draw Logo and left-aligned text
    doc.addImage(logoBase64, 'PNG', 14, startY - 5, 18, 18);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(schoolName, 36, startY);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    if (schoolSub) {
      startY += 5;
      doc.text(schoolSub, 36, startY);
    }
    if (schoolAddress) {
      startY += 4;
      doc.setFontSize(8);
      doc.text(schoolAddress, 36, startY);
    }
    if (schoolContact) {
      startY += 4;
      doc.setFontSize(8);
      doc.text(schoolContact, 36, startY);
    }
    startY += 8;
  } else {
    // Centered text when no logo
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(schoolName, w / 2, startY, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    if (schoolSub) {
      startY += 5;
      doc.text(schoolSub, w / 2, startY, { align: 'center' });
    }
    if (schoolAddress) {
      startY += 5;
      doc.setFontSize(8);
      doc.text(schoolAddress, w / 2, startY, { align: 'center' });
    }
    if (schoolContact) {
      startY += 4;
      doc.setFontSize(8);
      doc.text(schoolContact, w / 2, startY, { align: 'center' });
    }
    startY += 8;
  }

  // Separator Line
  doc.setDrawColor(226, 232, 240);
  doc.line(14, startY, w - 14, startY);
  
  startY += 10;
  // FEE RECEIPT Title
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('FEE RECEIPT', w / 2, startY, { align: 'center' });
  
  // Receipt info
  startY += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Receipt No: ${fee?.receipt_number || 'PENDING'}`, 14, startY);
  doc.text(`Date: ${formatDate(fee?.paid_date || fee?.created_at || new Date())}`, w - 14, startY, { align: 'right' });

  startY += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, startY, w - 14, startY);

  // Student Details
  startY += 8;
  const baseAmt = Number(fee?.total_amount || 0);
  const lateAmt = Number(fee?.late_fee_amount || 0);
  const netPayable = Number(fee?.net_payable ?? (baseAmt + lateAmt));
  const paidAmt = Number(fee?.paid_amount || 0);
  const balanceAmt = Math.max(0, Number(fee?.due_amount ?? fee?.balance ?? (netPayable - paidAmt)));

  const rows = [
    ['Student Name', `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || '—'],
    ['Student ID',   student?.student_id || '—'],
    ['Class',        `${student?.class || '—'} - ${student?.section || '—'}`],
    ['Parent Name',  student?.parent_name || '—'],
    ['Month / Year', `${fee?.month || '—'}${fee?.year ? ` ${fee.year}` : ''}`],
    ['Fee Type',     fee?.fee_type || 'Monthly'],
    ['Payment Mode', (fee?.payment_mode || '—').toUpperCase()],
    ['Total Fee',    `Rs. ${netPayable.toLocaleString('en-IN')}${lateAmt > 0 ? ` (incl. Late Fee Rs. ${lateAmt})` : ''}`],
    ['Balance Due',  `Rs. ${balanceAmt.toLocaleString('en-IN')}`],
  ];

  let y = startY;
  rows.forEach(([label, val]) => {
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8.5);
    doc.text(label, 14, y);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(String(val), 56, y);
    doc.setFont('helvetica', 'normal');
    y += 7;
  });

  // Amount Box
  y += 3;
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, y, w - 28, 24, 3, 3, 'F');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Cleared / Amount Paid', w / 2, y + 8, { align: 'center' });
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text(`Rs. ${paidAmt.toLocaleString('en-IN')}`, w / 2, y + 18, { align: 'center' });

  // Footer Note
  const fy = doc.internal.pageSize.height - 15;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  const splitFooter = doc.splitTextToSize(footerNote, w - 28);
  doc.text(splitFooter, w / 2, fy, { align: 'center' });

  doc.save(`Receipt_${fee?.receipt_number || 'fee'}.pdf`);
};

// ── Timetable PDF ─────────────────────────────────────────────────────────────
export const generateTimetablePDF = async ({
  cls,
  section,
  academicTerm = '2024-2025',
  effectiveDate = '',
  scheduleConfig,
  grid = {},
  settings = {}
}) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const schoolName = settings.school_name || 'School ERP';
  const schoolSub = settings.school_subtitle || 'School Management System';
  const schoolContact = [settings.school_address, settings.school_phone, settings.school_email].filter(Boolean).join(' | ');

  // Optional logo
  let logoBase64 = null;
  if (settings.school_logo_url) {
    logoBase64 = await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = settings.school_logo_url.startsWith('/')
        ? `${window.location.origin}${settings.school_logo_url}`
        : settings.school_logo_url;
    });
  }

  // Top header banner
  doc.setFillColor(30, 58, 138); // Royal Blue #1e3a8a
  doc.rect(0, 0, pageWidth, 28, 'F');

  let textLeft = 14;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 14, 4, 20, 20);
      textLeft = 38;
    } catch (e) {
      // ignore logo render error
    }
  }

  // School Name & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolName, textLeft, 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(240, 240, 240);
  doc.text(schoolContact || schoolSub, textLeft, 19);

  // Right-aligned Title in banner
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CLASS TIMETABLE', pageWidth - 14, 12, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(240, 240, 240);
  doc.text(`Academic Term: ${academicTerm}`, pageWidth - 14, 19, { align: 'right' });

  // Metadata Sub-banner
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 32, pageWidth - 28, 11, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 32, pageWidth - 28, 11, 2, 2, 'S');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Class: ${cls} — Section ${section}`, 18, 39);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Effective From: ${effectiveDate || '—'}`, 100, 39);

  const primarySchedule = getScheduleForDay(DAYS[0], scheduleConfig);
  const primaryTimeline = calculateDayTimeline(primarySchedule, scheduleConfig?.schoolEndTime);

  doc.text(`School Hours: ${primaryTimeline.startTimeFormatted} – ${primaryTimeline.endTimeFormatted}`, 180, 39);
  doc.text(`Total Periods: ${primarySchedule.numPeriods}`, pageWidth - 20, 39, { align: 'right' });

  // Table Columns Head
  const headCols = ['Day'];
  primaryTimeline.timeline.forEach(slot => {
    if (slot.isBreak) {
      headCols.push(`${slot.name || 'Break'}\n(${slot.time})`);
    } else {
      headCols.push(`Period ${slot.num}\n(${slot.time})`);
    }
  });

  // Table Body Rows
  const bodyRows = DAYS.map(day => {
    const daySched = getScheduleForDay(day, scheduleConfig);
    const row = [day];

    primaryTimeline.timeline.forEach(slot => {
      if (slot.isBreak) {
        row.push('BREAK');
      } else if (slot.num > daySched.numPeriods) {
        row.push('—');
      } else {
        const slotData = grid[day]?.[slot.num];
        if (slotData?.subject) {
          const tName = slotData.teacher_name ? `\n(${slotData.teacher_name})` : '';
          row.push(`${slotData.subject}${tName}`);
        } else {
          row.push('Free');
        }
      }
    });

    return row;
  });

  autoTable(doc, {
    startY: 47,
    margin: { left: 14, right: 14 },
    head: [headCols],
    body: bodyRows,
    theme: 'grid',
    headStyles: {
      fillColor: [110, 26, 51],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 8,
      cellPadding: 2.5
    },
    bodyStyles: {
      valign: 'middle',
      halign: 'center',
      fontSize: 7.5,
      cellPadding: 3,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: {
        cellWidth: 26,
        fontStyle: 'bold',
        halign: 'left',
        fillColor: [248, 250, 252],
        textColor: [30, 41, 59]
      }
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const val = String(data.cell.raw || '');
        if (val === 'BREAK' || val.toUpperCase() === 'BREAK') {
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.textColor = [148, 163, 184];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'Free') {
          data.cell.styles.textColor = [160, 174, 192];
          data.cell.styles.fontStyle = 'italic';
        } else if (val === '—') {
          data.cell.styles.fillColor = [248, 250, 252];
          data.cell.styles.textColor = [203, 213, 225];
        }
      }
    }
  });

  // Footer Note
  const fy = pageHeight - 10;
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('This is an official computer-generated timetable document from School ERP.', 14, fy);
  doc.text(
    `Printed on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    pageWidth - 14,
    fy,
    { align: 'right' }
  );

  doc.save(`Timetable_Class_${cls}_Section_${section}.pdf`);
};


// ── Consolidated Marksheet (All Exams Till Now) PDF ──────────────────────────
export const generateConsolidatedMarksheet = async (student, detailData, settings = {}) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const stu = detailData?.student || student || {};
  const academics = detailData?.academics || {};
  const exams = academics.exams || [];
  const attendance = detailData?.attendance || {};

  const logoBase64 = await loadLogoBase64(settings?.school_logo_url);
  const stuPhotoUrl = stu?.profile_photo || stu?.photo_url || stu?.photo || stu?.avatar;
  const studentPhotoBase64 = await loadPhotoBase64(stuPhotoUrl);

  // Page 1: Official Master Cumulative Marksheet Cum Certificate
  await renderCertificateMarksheetPage(doc, {
    student: stu,
    academics,
    attendance,
    settings,
    isConsolidated: true,
    logoBase64,
    studentPhotoBase64,
  });

  // Subsequent Pages: If multiple exams exist, render detailed term-by-term tables
  if (exams.length > 0) {
    doc.addPage();

    // Matching Royal Blue and Gold Outer Frame
    doc.setDrawColor(26, 54, 138);
    doc.setLineWidth(1.2);
    doc.rect(6, 6, 198, 285, 'S');
    doc.setDrawColor(245, 175, 20);
    doc.setLineWidth(0.8);
    doc.rect(7.6, 7.6, 194.8, 281.8, 'S');

    // Header strip
    doc.setFillColor(15, 23, 42);
    doc.rect(8, 8, 194, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('EXAMINATION-WISE TERM RECORD & PERFORMANCE BREAKDOWN', 105, 18, { align: 'center' });

    let currentY = 28;

    exams.forEach((exam, index) => {
      if (currentY > pageHeight - 55) {
        doc.addPage();
        doc.setDrawColor(26, 54, 138);
        doc.setLineWidth(1.2);
        doc.rect(6, 6, 198, 285, 'S');
        doc.setDrawColor(245, 175, 20);
        doc.setLineWidth(0.8);
        doc.rect(7.6, 7.6, 194.8, 281.8, 'S');
        currentY = 16;
      }

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(12, currentY, pageWidth - 24, 7, 1, 1, 'F');
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(
        `EXAM ${index + 1}: ${(exam.exam_name || 'EXAMINATION').toUpperCase()} (${(exam.exam_type || 'EXAM').replace('_', ' ').toUpperCase()}) — Date: ${formatDate(exam.created_at)}`,
        15,
        currentY + 5
      );

      const tableBody = (exam.subjects || []).map((sub) => {
        const sPct = sub.max_marks > 0 ? Math.round((sub.obtained_marks / sub.max_marks) * 100) : 0;
        return [
          sub.subject,
          sub.max_marks || '—',
          sub.obtained_marks != null ? sub.obtained_marks : '—',
          `${sPct}%`,
          sub.grade || getGrade(sub.obtained_marks, sub.max_marks),
          sPct >= 33 ? 'PASS' : 'FAIL',
        ];
      });

      autoTable(doc, {
        startY: currentY + 8,
        margin: { left: 12, right: 12 },
        head: [['Subject', 'Max Marks', 'Marks Obtained', 'Percentage', 'Grade', 'Result']],
        body: tableBody,
        foot: [[
          'Exam Total / Standing',
          exam.total_marks || '—',
          exam.total_obtained || '—',
          `${exam.percentage || 0}%`,
          exam.grade || '—',
          (exam.percentage || 0) >= 33 ? 'PASSED' : 'FAILED',
        ]],
        headStyles: {
          fillColor: [26, 54, 138],
          textColor: 255,
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 2,
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
          cellPadding: 2,
        },
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
          cellPadding: 2,
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold', cellWidth: 55 },
          1: { halign: 'center', cellWidth: 25 },
          2: { halign: 'center', fontStyle: 'bold', cellWidth: 30 },
          3: { halign: 'center', cellWidth: 25 },
          4: { halign: 'center', fontStyle: 'bold', cellWidth: 25 },
          5: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },
        },
      });

      currentY = doc.lastAutoTable.finalY + 8;
    });
  }

  const stuId = stu.student_id || 'student';
  const fName = (stu.first_name || '').replace(/\s+/g, '_');
  const lName = (stu.last_name || '').replace(/\s+/g, '_');
  doc.save(`Consolidated_Marksheet_${stuId}_${fName}_${lName}.pdf`);
};

// ── Comprehensive Performance Report PDF ──────────────────────────────────────
export const generateComprehensivePerformanceReport = (student, detailData, settings = {}) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const stu = detailData?.student || student || {};
  const academics = detailData?.academics || {};
  const attendance = detailData?.attendance || {};
  const achievements = detailData?.achievements || [];
  const exams = academics.exams || [];

  const schoolName = settings.school_name || 'INTERNATIONAL CAMBRIDGE PUBLIC SCHOOL KISHTWAR';
  const schoolSub = settings.school_subtitle || 'Holistic Student Progress & Academic Performance Assessment';

  // Header Banner
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageWidth, 34, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolName.toUpperCase(), pageWidth / 2, 13, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(schoolSub, pageWidth / 2, 19, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(147, 197, 253);
  doc.text('COMPREHENSIVE STUDENT PERFORMANCE DOSSIER', pageWidth / 2, 28, { align: 'center' });

  // Student Profile Summary Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(12, 38, pageWidth - 24, 28, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${stu.first_name || ''} ${stu.last_name || ''}`.toUpperCase(), 16, 45);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text(`Student ID: ${stu.student_id || '—'}`, 16, 52);
  doc.text(`Class & Section: ${stu.class || '—'} - ${stu.section || '—'}`, 16, 58);
  doc.text(`Roll Number: ${stu.roll_number || '—'}`, 16, 63);

  doc.text(`Parent / Guardian: ${stu.parent_name || '—'}`, 80, 52);
  doc.text(`Contact: ${stu.parent_phone || '—'}`, 80, 58);
  doc.text(`Date of Birth: ${formatDate(stu.date_of_birth)}`, 80, 63);

  doc.text(`Session: ${stu.session?.name || 'Current'}`, 145, 52);
  doc.text(`Blood Group: ${stu.blood_group || '—'}`, 145, 58);
  doc.text(`Date of Issue: ${formatDate(new Date())}`, 145, 63);

  let currentY = 71;

  // Key KPI Metrics Grid
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(12, currentY, pageWidth - 24, 18, 2, 2, 'F');

  const kpis = [
    { label: 'Overall Attendance', val: `${attendance.percentage || 0}%`, col: (attendance.percentage || 0) >= 75 ? [16, 185, 129] : [225, 29, 72] },
    { label: 'Academic Average', val: `${academics.average_percentage || 0}%`, col: [30, 41, 59] },
    { label: 'Overall Grade', val: academics.overall_grade || '—', col: [30, 41, 59] },
    { label: 'Exams Taken', val: `${academics.total_exams || exams.length}`, col: [30, 41, 59] },
    { label: 'Achievements', val: `${achievements.length}`, col: [30, 41, 59] },
  ];

  kpis.forEach((kpi, i) => {
    const x = 16 + i * 37;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x, currentY + 6);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(kpi.col[0], kpi.col[1], kpi.col[2]);
    doc.text(String(kpi.val), x, currentY + 14);
  });

  currentY += 23;

  // SECTION 1: ATTENDANCE PROGRESSION & BREAKDOWN
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. ATTENDANCE PROGRESSION & BREAKDOWN', 12, currentY);

  const attSummaryText = `Total Working Days: ${attendance.total_working_days || 0}  |  Present: ${attendance.present_days || 0}  |  Absent: ${attendance.absent_days || 0}  |  Late: ${attendance.late_days || 0}`;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(attSummaryText, 12, currentY + 5);

  const monthlyRows = (attendance.monthly || []).map((m) => [
    m.label,
    m.total,
    m.present,
    m.absent,
    m.late,
    `${m.percentage}%`,
  ]);

  if (monthlyRows.length > 0) {
    autoTable(doc, {
      startY: currentY + 8,
      margin: { left: 12, right: 12 },
      head: [['Month', 'Working Days', 'Present', 'Absent', 'Late', 'Monthly %']],
      body: monthlyRows,
      headStyles: { fillColor: [51, 65, 85], textColor: 255, fontSize: 8, fontStyle: 'bold', halign: 'center', cellPadding: 2 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], cellPadding: 2, halign: 'center' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
    });
    currentY = doc.lastAutoTable.finalY + 8;
  } else {
    currentY += 12;
  }

  // SECTION 2: EXAMINATION RESULTS SUMMARY
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. EXAMINATIONS & ACADEMIC EVALUATIONS', 12, currentY);

  const examRows = exams.map((ex) => [
    ex.exam_name,
    ex.exam_type ? ex.exam_type.replace('_', ' ').toUpperCase() : 'EXAM',
    formatDate(ex.created_at),
    ex.total_marks || '—',
    ex.total_obtained != null ? ex.total_obtained : '—',
    `${ex.percentage || 0}%`,
    ex.grade || '—',
    (ex.percentage || 0) >= 40 ? 'PASS' : 'FAIL',
  ]);

  if (examRows.length > 0) {
    autoTable(doc, {
      startY: currentY + 3,
      margin: { left: 12, right: 12 },
      head: [['Exam Name', 'Type', 'Date', 'Max Marks', 'Obtained', 'Percentage', 'Grade', 'Result']],
      body: examRows,
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 8, fontStyle: 'bold', halign: 'center', cellPadding: 2 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], cellPadding: 2, halign: 'center' },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
        4: { fontStyle: 'bold' },
        5: { fontStyle: 'bold' },
        6: { fontStyle: 'bold' },
      },
    });
    currentY = doc.lastAutoTable.finalY + 8;
  } else {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text('No examination records recorded yet.', 12, currentY + 6);
    currentY += 12;
  }

  // SECTION 3: SUBJECT MASTERY BREAKDOWN
  if (academics.subject_breakdown?.length > 0) {
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('3. SUBJECT-WISE AGGREGATE PERFORMANCE', 12, currentY);

    const subRows = academics.subject_breakdown.map((s) => [
      s.subject,
      s.exams_count,
      s.total_max,
      s.total_obtained,
      `${s.average_percentage}%`,
      s.grade,
      s.average_percentage >= 80 ? 'Mastery / Advanced' : s.average_percentage >= 60 ? 'Proficient' : s.average_percentage >= 40 ? 'Developing' : 'Intervention Needed',
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      margin: { left: 12, right: 12 },
      head: [['Subject', 'Exams', 'Total Max', 'Total Obtained', 'Average %', 'Grade', 'Assessment']],
      body: subRows,
      headStyles: { fillColor: [51, 65, 85], textColor: 255, fontSize: 8, fontStyle: 'bold', halign: 'center', cellPadding: 2 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], cellPadding: 2, halign: 'center' },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
        4: { fontStyle: 'bold' },
        5: { fontStyle: 'bold' },
      },
    });
    currentY = doc.lastAutoTable.finalY + 8;
  }

  // SECTION 4: EXTRACURRICULAR ACHIEVEMENTS
  if (achievements.length > 0) {
    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('4. CO-CURRICULAR ACHIEVEMENTS & AWARDS', 12, currentY);

    const achRows = achievements.map((a) => [
      a.title,
      a.category || 'General',
      a.position || 'Participant',
      a.level || 'School',
      formatDate(a.event_date),
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      margin: { left: 12, right: 12 },
      head: [['Title / Activity', 'Category', 'Position / Recognition', 'Level', 'Date']],
      body: achRows,
      headStyles: { fillColor: [180, 83, 9], textColor: 255, fontSize: 8, fontStyle: 'bold', halign: 'center', cellPadding: 2 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], cellPadding: 2, halign: 'center' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
    });
    currentY = doc.lastAutoTable.finalY + 8;
  }

  // SECTION 5: SIGNATURES
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 20;
  }

  currentY += 8;
  const sigY = currentY + 12;
  const sig1X = 20;
  const sig2X = 85;
  const sig3X = 150;

  doc.setDrawColor(148, 163, 184);
  doc.line(sig1X, sigY, sig1X + 42, sigY);
  doc.line(sig2X, sigY, sig2X + 42, sigY);
  doc.line(sig3X, sigY, sig3X + 42, sigY);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Class Teacher Signature', sig1X + 21, sigY + 5, { align: 'center' });
  doc.text('Academic Coordinator', sig2X + 21, sigY + 5, { align: 'center' });
  doc.text('Principal / School Seal', sig3X + 21, sigY + 5, { align: 'center' });

  // Page Numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Confidential Performance Dossier · Student ID: ${stu.student_id || 'N/A'} · Generated on ${new Date().toLocaleString('en-IN')}`,
      12,
      pageHeight - 6
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 12, pageHeight - 6, { align: 'right' });
  }

  doc.save(`Performance_Report_${stu.student_id || 'student'}_${stu.first_name || ''}_${stu.last_name || ''}.pdf`);
};
