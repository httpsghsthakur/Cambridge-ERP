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
  doc.text(settings?.school_name || 'INTERNATIONAL CAMBRIDGE SCHOOL KISHTWAR', pageWidth / 2, 16, { align: 'center' });

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
export const generateConsolidatedMarksheet = (student, detailData, settings = {}) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const stu = detailData?.student || student || {};
  const academics = detailData?.academics || {};
  const exams = academics.exams || [];
  const attendance = detailData?.attendance || {};

  const schoolName = settings.school_name || 'INTERNATIONAL CAMBRIDGE SCHOOL KISHTWAR';
  const schoolSub = settings.school_subtitle || 'Affiliated to Central Board of Secondary Education';
  const schoolAddress = settings.school_address || 'Kishtwar, Jammu & Kashmir';

  // 1. School Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolName.toUpperCase(), pageWidth / 2, 13, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  if (schoolSub) doc.text(schoolSub, pageWidth / 2, 19, { align: 'center' });
  if (schoolAddress) doc.text(schoolAddress, pageWidth / 2, 24, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(147, 197, 253); // blue-300
  doc.text('CONSOLIDATED CUMULATIVE MARKSHEET / ACADEMIC TRANSCRIPT', pageWidth / 2, 31, { align: 'center' });

  // 2. Student Info Card
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(12, 41, pageWidth - 24, 30, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${stu.first_name || ''} ${stu.last_name || ''}`.toUpperCase(), 16, 48);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const leftColX = 16;
  const midColX = 80;
  const rightColX = 145;

  doc.text(`Student ID: ${stu.student_id || '—'}`, leftColX, 55);
  doc.text(`Class & Section: ${stu.class || '—'} - ${stu.section || '—'}`, leftColX, 61);
  doc.text(`Roll Number: ${stu.roll_number || '—'}`, leftColX, 67);

  doc.text(`Parent / Guardian: ${stu.parent_name || '—'}`, midColX, 55);
  doc.text(`Contact: ${stu.parent_phone || '—'}`, midColX, 61);
  doc.text(`Date of Birth: ${formatDate(stu.date_of_birth)}`, midColX, 67);

  const avgPct = academics.average_percentage || 0;
  const overallGrade = academics.overall_grade || getGrade(avgPct, 100);
  const attPct = attendance.percentage != null ? `${attendance.percentage}%` : '—';

  doc.text(`Academic Session: ${stu.session?.name || 'Current'}`, rightColX, 55);
  doc.text(`Overall Cumulative Grade: ${overallGrade}`, rightColX, 61);
  doc.text(`Overall Attendance: ${attPct}`, rightColX, 67);

  let currentY = 76;

  // 3. Overall Performance Summary Strip
  doc.setFillColor(239, 246, 255); // blue-50
  doc.roundedRect(12, currentY, pageWidth - 24, 14, 1.5, 1.5, 'F');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175); // blue-800
  doc.text(`Total Examinations Recorded: ${exams.length}`, 16, currentY + 9);
  doc.text(`Cumulative Marks Average: ${avgPct}%`, 80, currentY + 9);
  doc.text(`Status: ${avgPct >= 40 ? 'PASSED (QUALIFIED)' : 'NEEDS IMPROVEMENT'}`, 145, currentY + 9);

  currentY += 18;

  // 4. All Exams Detailed Marks Tables
  if (exams.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'italic');
    doc.text('No examination marks have been officially recorded for this student yet.', pageWidth / 2, currentY + 15, { align: 'center' });
    currentY += 30;
  } else {
    // Generate Table for EACH Exam
    exams.forEach((exam, index) => {
      // Check if page break is needed
      if (currentY > pageHeight - 55) {
        doc.addPage();
        currentY = 16;
      }

      // Exam Header Label
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
          sPct >= 40 ? 'PASS' : 'FAIL',
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
          (exam.percentage || 0) >= 40 ? 'PASSED' : 'FAILED',
        ]],
        headStyles: {
          fillColor: [30, 41, 59],
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

    // 5. Subject Lifetime Average Summary Table
    if (academics.subject_breakdown?.length > 0) {
      if (currentY > pageHeight - 55) {
        doc.addPage();
        currentY = 16;
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('CUMULATIVE SUBJECT MASTERY & PERFORMANCE SUMMARY', 12, currentY);

      const subRows = academics.subject_breakdown.map((s) => [
        s.subject,
        s.exams_count,
        s.total_max,
        s.total_obtained,
        `${s.average_percentage}%`,
        s.grade,
      ]);

      autoTable(doc, {
        startY: currentY + 3,
        margin: { left: 12, right: 12 },
        head: [['Subject', 'Exams Taken', 'Total Max', 'Total Obtained', 'Cumulative %', 'Overall Grade']],
        body: subRows,
        headStyles: {
          fillColor: [51, 65, 85],
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
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center', fontStyle: 'bold' },
          4: { halign: 'center', fontStyle: 'bold' },
          5: { halign: 'center', fontStyle: 'bold' },
        },
      });

      currentY = doc.lastAutoTable.finalY + 8;
    }
  }

  // Check signature space
  if (currentY > pageHeight - 40) {
    doc.addPage();
    currentY = 20;
  }

  // 6. Grading Scale Reference
  doc.setFillColor(248, 250, 252);
  doc.rect(12, currentY, pageWidth - 24, 10, 'F');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'GRADING SCHEME: A+ (90-100% Outstanding) | A (80-89% Excellent) | B (70-79% Very Good) | C (60-69% Good) | D (40-59% Pass) | F (<40% Needs Improvement)',
    pageWidth / 2,
    currentY + 6,
    { align: 'center' }
  );

  currentY += 16;

  // 7. Signatures
  doc.setDrawColor(148, 163, 184);
  const sigY = currentY + 12;
  const sig1X = 20;
  const sig2X = 85;
  const sig3X = 150;

  doc.line(sig1X, sigY, sig1X + 42, sigY);
  doc.line(sig2X, sigY, sig2X + 42, sigY);
  doc.line(sig3X, sigY, sig3X + 42, sigY);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Class Teacher Signature', sig1X + 21, sigY + 5, { align: 'center' });
  doc.text('Exam Controller Signature', sig2X + 21, sigY + 5, { align: 'center' });
  doc.text('Principal / Head of School', sig3X + 21, sigY + 5, { align: 'center' });

  // 8. Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Official Marksheet · Student ID: ${stu.student_id || 'N/A'} · Generated on ${new Date().toLocaleString('en-IN')}`,
      12,
      pageHeight - 6
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 12, pageHeight - 6, { align: 'right' });
  }

  doc.save(`Consolidated_Marksheet_${stu.student_id || 'student'}_${stu.first_name || ''}_${stu.last_name || ''}.pdf`);
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

  const schoolName = settings.school_name || 'INTERNATIONAL CAMBRIDGE SCHOOL KISHTWAR';
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
