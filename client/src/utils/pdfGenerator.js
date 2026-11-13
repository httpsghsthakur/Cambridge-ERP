import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, getGrade } from './helpers';
import { DAYS, getScheduleForDay, calculateDayTimeline } from './timetableHelper';

// ── Report Card PDF ───────────────────────────────────────────────────────────
export const generateReportCard = (student, result) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header background
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // School name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('EduSmart Public School', pageWidth / 2, 16, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Report Card — Academic Session 2024-2025', pageWidth / 2, 26, { align: 'center' });
  doc.text(result?.exam_name || 'Examination', pageWidth / 2, 34, { align: 'center' });

  // Reset color
  doc.setTextColor(30, 41, 59);

  // Student info box
  doc.setFillColor(248, 249, 252);
  doc.roundedRect(14, 46, pageWidth - 28, 34, 3, 3, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${student?.first_name || ''} ${student?.last_name || ''}`, 20, 57);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Student ID: ${student?.student_id || '—'}`, 20, 65);
  doc.text(`Class: ${result?.class || student?.class || '—'} - ${result?.section || student?.section || '—'}`, 20, 72);

  doc.text(`Exam: ${result?.exam_name || '—'}`, 110, 65);
  doc.text(`Date: ${formatDate(new Date())}`, 110, 72);

  // Marks table
  doc.setTextColor(30, 41, 59);
  const tableData = (result?.subjects || []).map(s => [
    s.subject,
    s.max_marks,
    s.obtained_marks,
    `${Math.round((s.obtained_marks / s.max_marks) * 100)}%`,
    getGrade(s.obtained_marks, s.max_marks),
  ]);

  autoTable(doc, {
    startY: 86,
    head: [['Subject', 'Max Marks', 'Obtained', 'Percentage', 'Grade']],
    body: tableData,
    foot: [[
      'Total',
      result?.total_marks || 0,
      result?.total_obtained || 0,
      `${result?.percentage || 0}%`,
      result?.grade || '—',
    ]],
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 9, fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
    bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { halign: 'center' },
      2: { halign: 'center', fontStyle: 'bold' },
      3: { halign: 'center' },
      4: { halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // Summary section
  const finalY = doc.lastAutoTable.finalY + 12;
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, finalY, pageWidth - 28, 28, 3, 3, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);

  const cols = [
    ['Overall Grade', result?.grade || '—'],
    ['Percentage',    `${result?.percentage || 0}%`],
    ['Rank',          result?.rank ? `${result.rank}` : '—'],
    ['Result',        (result?.percentage || 0) >= 40 ? 'PASS' : 'FAIL'],
  ];

  cols.forEach(([label, val], i) => {
    const x = 20 + i * 44;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x, finalY + 10);
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(String(val), x, finalY + 22);
  });

  // Footer
  const footY = doc.internal.pageSize.height - 18;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footY - 4, pageWidth - 14, footY - 4);
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a computer-generated report card.', pageWidth / 2, footY, { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, footY + 6, { align: 'center' });

  doc.save(`ReportCard_${student?.student_id || 'student'}_${result?.exam_name?.replace(/\s/g, '_') || 'exam'}.pdf`);
};

// ── Fee Receipt PDF ───────────────────────────────────────────────────────────
export const generateFeeReceipt = async (fee, student, settings = {}) => {
  const doc = new jsPDF({ unit: 'mm', format: [148, 210] }); // A5
  const w = doc.internal.pageSize.width;

  const schoolName = settings.school_name || 'EduSmart Public School';
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
  doc.setFillColor(110, 26, 51); // #6E1A33
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
