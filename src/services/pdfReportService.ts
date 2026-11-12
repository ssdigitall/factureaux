import { jsPDF } from 'jspdf';

export interface DailyReportPayload {
  date: string;
  formattedDateFr: string;
  organisationNom: string;
  forages: Array<{ id: string; nom: string }>;
  paiements: Array<{
    id: string;
    numeroFacture: string;
    recuNumero: string;
    abonneNom: string;
    forageId: string;
    montantFCFA: number;
    modePaiement: string;
    datePaiement: string;
  }>;
  totalRevenusFCFA: number;
  paiementsParMode: {
    wave: number;
    orangeMoney: number;
    especes: number;
    autres: number;
  };
  depenses: Array<{
    id: string;
    categorie: string;
    description: string;
    compteNom: string;
    montantFCFA: number;
    valideParNom?: string;
  }>;
  totalDepensesFCFA: number;
  soldeNetJournalierFCFA: number;
  production: Array<{
    id: string;
    forageNom: string;
    ancienIndexM3: number;
    nouvelIndexM3: number;
    volumeProduitM3: number;
    agentNom: string;
  }>;
  totalVolumeProduitM3: number;
  comptes: Array<{
    id: string;
    nom: string;
    type: string;
    soldeActuelFCFA: number;
  }>;
  totalSoldeCaisseFCFA: number;
  agentNom: string;
  agentRole: string;
}

export function generateDailyReportPdf(data: DailyReportPayload): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Colors
  const primaryNavy = [8, 47, 73]; // #082F49
  const accentBlue = [3, 105, 161]; // #0369A1
  const cyan = [6, 182, 212]; // #06B6D4
  const emerald = [16, 185, 129]; // #10B981
  const rose = [225, 29, 72]; // #E11D48
  const textDark = [30, 41, 59]; // #1E293B
  const textMuted = [100, 116, 139]; // #64748B
  const bgLight = [248, 250, 252]; // #F8FAFC
  const borderLight = [226, 232, 240]; // #E2E8F0

  // 1. TOP HEADER BRANDING BAR
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.roundedRect(margin, 12, contentWidth, 24, 3, 3, 'F');

  // Accent gradient line on bottom of header
  doc.setFillColor(cyan[0], cyan[1], cyan[2]);
  doc.rect(margin, 35, contentWidth, 1.2, 'F');

  // Logo text & Slogan
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('FACTUREAU', margin + 6, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(165, 243, 252); // cyan-200
  doc.text("L'eau bien gérée, l'avenir assuré - Gestion Eau & Forages", margin + 6, 29);

  // Right Header Document Tag
  doc.setFillColor(12, 74, 117);
  doc.roundedRect(pageWidth - margin - 68, 16, 62, 16, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('RAPPORT JOURNALIER', pageWidth - margin - 65, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(224, 242, 254);
  doc.text(`Date : ${data.date}`, pageWidth - margin - 65, 28);

  // 2. CONTEXT SUB-BAR
  let currentY = 41;
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`ASUFOR / Organisation : ${data.organisationNom}`, margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const genTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  doc.text(`Généré le ${data.formattedDateFr} à ${genTime} par ${data.agentNom} (${data.agentRole})`, margin, currentY + 4.5);

  // 3. SYNTHESIS KPI METRIC BOXES (4 columns)
  currentY += 10;
  const boxWidth = (contentWidth - 9) / 4; // ~43.25mm each
  const boxHeight = 17;

  // Box 1: Recettes
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(margin, currentY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFillColor(emerald[0], emerald[1], emerald[2]);
  doc.rect(margin, currentY, 2, boxHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('RECETTES DU JOUR', margin + 4, currentY + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(emerald[0], emerald[1], emerald[2]);
  doc.text(`${data.totalRevenusFCFA.toLocaleString('fr-FR')} F`, margin + 4, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`${data.paiements.length} encaissements`, margin + 4, currentY + 15);

  // Box 2: Dépenses
  const box2X = margin + boxWidth + 3;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(box2X, currentY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFillColor(rose[0], rose[1], rose[2]);
  doc.rect(box2X, currentY, 2, boxHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('DÉPENSES VALIDÉES', box2X + 4, currentY + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(rose[0], rose[1], rose[2]);
  doc.text(`${data.totalDepensesFCFA.toLocaleString('fr-FR')} F`, box2X + 4, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`${data.depenses.length} décaissements`, box2X + 4, currentY + 15);

  // Box 3: Solde Net Journalier
  const box3X = box2X + boxWidth + 3;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(box3X, currentY, boxWidth, boxHeight, 2, 2, 'FD');
  const isSoldePositive = data.soldeNetJournalierFCFA >= 0;
  const soldeColor = isSoldePositive ? emerald : rose;
  doc.setFillColor(soldeColor[0], soldeColor[1], soldeColor[2]);
  doc.rect(box3X, currentY, 2, boxHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('SOLDE NET DU JOUR', box3X + 4, currentY + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(soldeColor[0], soldeColor[1], soldeColor[2]);
  const soldeSign = data.soldeNetJournalierFCFA > 0 ? '+' : '';
  doc.text(`${soldeSign}${data.soldeNetJournalierFCFA.toLocaleString('fr-FR')} F`, box3X + 4, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Flux net de caisse', box3X + 4, currentY + 15);

  // Box 4: Volume d'eau produit
  const box4X = box3X + boxWidth + 3;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(box4X, currentY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.rect(box4X, currentY, 2, boxHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('EAU POMPÉE (PROD.)', box4X + 4, currentY + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.text(`${data.totalVolumeProduitM3.toLocaleString('fr-FR')} m³`, box4X + 4, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`${data.production.length} forages relevés`, box4X + 4, currentY + 15);

  // 4. SECTION 1: ENCAISSEMENTS & REVENUS DU JOUR
  currentY += 23;
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(margin, currentY, 3, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('1. DÉTAIL DES ENCAISSEMENTS & REVENUS DU JOUR', margin + 5, currentY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    `Wave: ${data.paiementsParMode.wave.toLocaleString('fr-FR')} F | OM: ${data.paiementsParMode.orangeMoney.toLocaleString('fr-FR')} F | Espèces: ${data.paiementsParMode.especes.toLocaleString('fr-FR')} F`,
    pageWidth - margin - 85,
    currentY + 4
  );

  currentY += 7;

  // Table 1 Header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, currentY, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('HEURE', margin + 2, currentY + 4);
  doc.text('N° REÇU', margin + 20, currentY + 4);
  doc.text('ABONNÉ / CLIENT', margin + 48, currentY + 4);
  doc.text('N° FACTURE', margin + 98, currentY + 4);
  doc.text('MODE', margin + 132, currentY + 4);
  doc.text('MONTANT', margin + 158, currentY + 4);

  currentY += 6;

  if (data.paiements.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Aucun encaissement enregistré pour cette date.', margin + 4, currentY + 5);
    currentY += 8;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    data.paiements.slice(0, 7).forEach((p, idx) => {
      const rowY = currentY + idx * 5.2;
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, rowY - 1, contentWidth, 5.2, 'F');
      }
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      const heure = p.datePaiement.includes(' ') ? p.datePaiement.split(' ')[1] : '--:--';
      doc.text(heure, margin + 2, rowY + 2.8);
      doc.text(p.recuNumero || '-', margin + 20, rowY + 2.8);
      doc.text(p.abonneNom.substring(0, 26), margin + 48, rowY + 2.8);
      doc.text(p.numeroFacture || '-', margin + 98, rowY + 2.8);
      doc.text(p.modePaiement.replace('_', ' '), margin + 132, rowY + 2.8);
      doc.setFont('helvetica', 'bold');
      doc.text(`${p.montantFCFA.toLocaleString('fr-FR')} FCFA`, margin + 158, rowY + 2.8);
      doc.setFont('helvetica', 'normal');
    });
    currentY += Math.min(data.paiements.length, 7) * 5.2 + 2;
  }

  // 5. SECTION 2: DÉPENSES & DÉCAISSEMENTS DU JOUR
  currentY += 3;
  doc.setFillColor(rose[0], rose[1], rose[2]);
  doc.rect(margin, currentY, 3, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('2. DÉTAIL DES DÉPENSES & DÉCAISSEMENTS VALIDÉS', margin + 5, currentY + 4);

  currentY += 7;

  // Table 2 Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('CATÉGORIE', margin + 2, currentY + 4);
  doc.text('DESCRIPTION / MOTIF', margin + 35, currentY + 4);
  doc.text('COMPTE CAISSE', margin + 105, currentY + 4);
  doc.text('VALIDATEUR', margin + 140, currentY + 4);
  doc.text('MONTANT', margin + 162, currentY + 4);

  currentY += 6;

  if (data.depenses.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Aucune dépense validée pour cette journée.', margin + 4, currentY + 5);
    currentY += 8;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    data.depenses.slice(0, 5).forEach((d, idx) => {
      const rowY = currentY + idx * 5.2;
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, rowY - 1, contentWidth, 5.2, 'F');
      }
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(d.categorie.replace('_', ' ').substring(0, 18), margin + 2, rowY + 2.8);
      doc.text(d.description.substring(0, 42), margin + 35, rowY + 2.8);
      doc.text(d.compteNom.substring(0, 20), margin + 105, rowY + 2.8);
      doc.text(d.valideParNom || 'Trésorier', margin + 140, rowY + 2.8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(rose[0], rose[1], rose[2]);
      doc.text(`${d.montantFCFA.toLocaleString('fr-FR')} F`, margin + 162, rowY + 2.8);
      doc.setFont('helvetica', 'normal');
    });
    currentY += Math.min(data.depenses.length, 5) * 5.2 + 2;
  }

  // 6. SECTION 3: RELEVÉS DE PRODUCTION D'EAU DU JOUR
  currentY += 3;
  doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.rect(margin, currentY, 3, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("3. PRODUCTION D'EAU & EXPLOITATION DES FORAGES", margin + 5, currentY + 4);

  currentY += 7;

  // Table 3 Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('FORAGE / SITE', margin + 2, currentY + 4);
  doc.text('ANCIEN INDEX (m³)', margin + 65, currentY + 4);
  doc.text('NOUVEL INDEX (m³)', margin + 102, currentY + 4);
  doc.text('VOLUME POMPÉ', margin + 140, currentY + 4);
  doc.text('AGENT TECHNIQUE', margin + 162, currentY + 4);

  currentY += 6;

  if (data.production.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Aucun relevé de production saisi ce jour.', margin + 4, currentY + 5);
    currentY += 8;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    data.production.forEach((prod, idx) => {
      const rowY = currentY + idx * 5.2;
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, rowY - 1, contentWidth, 5.2, 'F');
      }
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(prod.forageNom, margin + 2, rowY + 2.8);
      doc.text(`${prod.ancienIndexM3.toLocaleString('fr-FR')} m³`, margin + 65, rowY + 2.8);
      doc.text(`${prod.nouvelIndexM3.toLocaleString('fr-FR')} m³`, margin + 102, rowY + 2.8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
      doc.text(`+${prod.volumeProduitM3.toLocaleString('fr-FR')} m³`, margin + 140, rowY + 2.8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(prod.agentNom, margin + 162, rowY + 2.8);
    });
    currentY += data.production.length * 5.2 + 2;
  }

  // 7. BOTTOM SECTION: COMPTES DE TRÉSORERIE & VISAS OFFICIELS
  currentY += 4;
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 4;
  const colHalf = (contentWidth - 6) / 2;

  // Left: Soldes des comptes
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(margin, currentY, colHalf, 25, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('ÉTAT DE TRÉSORERIE DISPONIBLE EN CAISSE', margin + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  let accY = currentY + 10;
  data.comptes.slice(0, 3).forEach((c) => {
    doc.text(`• ${c.nom.substring(0, 24)} :`, margin + 4, accY);
    doc.setFont('helvetica', 'bold');
    doc.text(`${c.soldeActuelFCFA.toLocaleString('fr-FR')} FCFA`, margin + colHalf - 25, accY);
    doc.setFont('helvetica', 'normal');
    accY += 4.5;
  });

  // Right: Signature & Stamp Box
  const rightColX = margin + colHalf + 6;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(rightColX, currentY, colHalf, 25, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('VISAS DE CLÔTURE JOURNALIÈRE', rightColX + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Visa Trésorier :', rightColX + 4, currentY + 11);
  doc.text('Approbation Présidence :', rightColX + 48, currentY + 11);

  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(rightColX + 4, currentY + 13, 38, 9, 1, 1, 'S');
  doc.roundedRect(rightColX + 48, currentY + 13, 38, 9, 1, 1, 'S');

  doc.setFontSize(5.5);
  doc.text('[ Signature & Cachet ]', rightColX + 11, currentY + 19);
  doc.text('[ Signature & Cachet ]', rightColX + 55, currentY + 19);

  // 8. LEGAL FOOTER
  const footerY = pageHeight - 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    'FACTUREAU SaaS V3.0 - Plateforme de gestion des forages et services d eau potable | Document officiel certifié conforme',
    margin,
    footerY
  );
  doc.text('Page 1 / 1', pageWidth - margin - 15, footerY);

  return doc;
}

export function exportDailyReportPdf(data: DailyReportPayload): void {
  const doc = generateDailyReportPdf(data);
  const fileName = `Rapport_Journalier_FACTUREAU_${data.date}.pdf`;
  doc.save(fileName);
}
