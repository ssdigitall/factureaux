import { jsPDF } from 'jspdf';
import { Facture, ReleveProduction, Forage, Organisation } from '../types';

export interface BillingReportPayload {
  organisationNom: string;
  departement: string;
  region: string;
  periode: string; // e.g. "Novembre 2026"
  dateGeneration: string;
  forageNom: string;
  factures: Array<{
    id: string;
    numeroFacture: string;
    abonneCode: string;
    abonneNom: string;
    abonneQuartier?: string;
    consommationM3: number;
    totalTTCFCFA: number;
    montantPayeFCFA: number;
    resteDuFCFA: number;
    statut: string;
    dateEmission: string;
    dateEcheance: string;
  }>;
  totalFactureTTC: number;
  totalVolumeM3: number;
  totalEncaisseFCFA: number;
  totalImpayesFCFA: number;
  tauxRecouvrement: number;
  facturesPayeesCount: number;
  facturesImpayeesCount: number;
}

export interface ProductionReportPayload {
  organisationNom: string;
  departement: string;
  region: string;
  periode: string; // e.g. "Novembre 2026"
  dateGeneration: string;
  forageNom: string;
  releves: Array<{
    id: string;
    dateReleve: string;
    forageNom: string;
    ancienIndexM3: number;
    nouvelIndexM3: number;
    volumeProduitM3: number;
    agentNom: string;
  }>;
  totalVolumeProduitM3: number;
  totalVolumeConsommeM3: number;
  totalPertesM3: number;
  tauxPertePourcent: number;
  tauxRendementPourcent: number;
  foragesStats: Array<{
    nom: string;
    debitNominal: number;
    typePompe: string;
    volumeM3: number;
    partPourcent: number;
  }>;
}

/**
 * Génère le document PDF exhaustif du Rapport de Facturation
 */
export function generateBillingReportPdf(data: BillingReportPayload): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryNavy = [8, 47, 73] as const;
  const accentCyan = [14, 165, 233] as const;
  const successEmerald = [16, 185, 129] as const;
  const alertRose = [225, 29, 72] as const;
  const slateDark = [30, 41, 59] as const;
  const slateLight = [241, 245, 249] as const;
  const borderGray = [226, 232, 240] as const;

  // Function to render header on any page
  const renderHeader = (pageNumber: number, totalPages: number) => {
    // Header Banner
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.roundedRect(margin, margin, contentWidth, 24, 3, 3, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('FACTUREAU • ÉTAT OFFICIEL DE FACTURATION DES USAGERS', margin + 6, margin + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      `${data.organisationNom} • Dépt. ${data.departement} (${data.region}) • Période : ${data.periode}`,
      margin + 6,
      margin + 16
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`Périmètre : ${data.forageNom}`, margin + 6, margin + 21);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Page ${pageNumber}/${totalPages}`, pageWidth - margin - 6, margin + 9, { align: 'right' });
    doc.text(`Généré le ${data.dateGeneration}`, pageWidth - margin - 6, margin + 16, { align: 'right' });
    doc.text('Certifié conforme', pageWidth - margin - 6, margin + 21, { align: 'right' });
  };

  // --- PAGE 1: En-tête + Synthèse Macro-KPIs + Début du Tableau ---
  renderHeader(1, 2);

  let currentY = margin + 30;

  // KPI Summary Grid (6 cards)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('1. SYNTHÈSE DE LA FACTURATION & RECOUVREMENT', margin, currentY);
  currentY += 4;

  const cardW = (contentWidth - 8) / 3;
  const cardH = 15;

  const kpisRow1 = [
    { label: 'Total Facturé TTC', value: `${data.totalFactureTTC.toLocaleString('fr-FR')} FCFA`, color: primaryNavy },
    { label: 'Recettes Encaissées', value: `${data.totalEncaisseFCFA.toLocaleString('fr-FR')} FCFA`, color: successEmerald },
    { label: 'Créances Impayées', value: `${data.totalImpayesFCFA.toLocaleString('fr-FR')} FCFA`, color: alertRose },
  ];

  const kpisRow2 = [
    { label: 'Volume Facturé', value: `${data.totalVolumeM3.toLocaleString('fr-FR')} m³`, color: accentCyan },
    { label: 'Taux Recouvrement', value: `${data.tauxRecouvrement}%`, color: successEmerald },
    { label: 'Factures Soldées / Émises', value: `${data.facturesPayeesCount} / ${data.factures.length}`, color: primaryNavy },
  ];

  // Draw Row 1
  kpisRow1.forEach((kpi, idx) => {
    const x = margin + idx * (cardW + 4);
    doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(x, currentY, cardW, cardH, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3.5, currentY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3.5, currentY + 11.5);
  });

  currentY += cardH + 3;

  // Draw Row 2
  kpisRow2.forEach((kpi, idx) => {
    const x = margin + idx * (cardW + 4);
    doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(x, currentY, cardW, cardH, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3.5, currentY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3.5, currentY + 11.5);
  });

  currentY += cardH + 7;

  // Table Section Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('2. ÉTAT DÉTAILLÉ NOMINATIF DES FACTURES D\'EAU', margin, currentY);
  currentY += 4;

  // Table Columns
  // Col widths: N° (28), Code (18), Usager (42), Quartier (24), Conso (16), Total TTC (22), Payé (18), Reste (14)
  const cols = [
    { title: 'N° Facture', width: 28, align: 'left' as const },
    { title: 'Code', width: 17, align: 'left' as const },
    { title: 'Nom Abonné', width: 40, align: 'left' as const },
    { title: 'Quartier', width: 22, align: 'left' as const },
    { title: 'Conso m³', width: 16, align: 'right' as const },
    { title: 'Total TTC', width: 22, align: 'right' as const },
    { title: 'Payé', width: 19, align: 'right' as const },
    { title: 'Reste Dû', width: 18, align: 'right' as const },
  ];

  const renderTableHeader = (y: number) => {
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);

    let curX = margin;
    cols.forEach((col) => {
      const textX = col.align === 'right' ? curX + col.width - 2 : curX + 2;
      doc.text(col.title, textX, y + 4.2, { align: col.align });
      curX += col.width;
    });
  };

  renderTableHeader(currentY);
  currentY += 6;

  // Draw Invoices rows
  const maxRowsPage1 = 20;
  const page1Factures = data.factures.slice(0, maxRowsPage1);
  const remainingFactures = data.factures.slice(maxRowsPage1);

  const drawInvoiceRow = (f: BillingReportPayload['factures'][0], y: number, isAlt: boolean) => {
    if (isAlt) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 5.2, 'F');
    }
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 5.2, margin + contentWidth, y + 5.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);

    let curX = margin;
    // N° Facture
    doc.setFont('helvetica', 'bold');
    doc.text(f.numeroFacture, curX + 2, y + 3.8);
    curX += cols[0].width;

    // Code
    doc.setFont('helvetica', 'normal');
    doc.text(f.abonneCode, curX + 2, y + 3.8);
    curX += cols[1].width;

    // Nom (truncated if too long)
    const truncatedNom = f.abonneNom.length > 22 ? f.abonneNom.substring(0, 20) + '..' : f.abonneNom;
    doc.text(truncatedNom, curX + 2, y + 3.8);
    curX += cols[2].width;

    // Quartier
    const qStr = (f.abonneQuartier || 'Centre').substring(0, 14);
    doc.text(qStr, curX + 2, y + 3.8);
    curX += cols[3].width;

    // Conso
    doc.text(`${f.consommationM3} m³`, curX + cols[4].width - 2, y + 3.8, { align: 'right' });
    curX += cols[4].width;

    // Total TTC
    doc.setFont('helvetica', 'bold');
    doc.text(`${f.totalTTCFCFA.toLocaleString('fr-FR')}`, curX + cols[5].width - 2, y + 3.8, { align: 'right' });
    curX += cols[5].width;

    // Payé
    doc.setTextColor(successEmerald[0], successEmerald[1], successEmerald[2]);
    doc.text(`${f.montantPayeFCFA.toLocaleString('fr-FR')}`, curX + cols[6].width - 2, y + 3.8, { align: 'right' });
    curX += cols[6].width;

    // Reste Dû
    if (f.resteDuFCFA > 0) {
      doc.setTextColor(alertRose[0], alertRose[1], alertRose[2]);
    } else {
      doc.setTextColor(148, 163, 184);
    }
    doc.text(`${f.resteDuFCFA.toLocaleString('fr-FR')}`, curX + cols[7].width - 2, y + 3.8, { align: 'right' });
  };

  page1Factures.forEach((f, idx) => {
    drawInvoiceRow(f, currentY, idx % 2 === 1);
    currentY += 5.2;
  });

  // --- PAGE 2: Suite des Factures + Totaux + Cadre d'approbation ---
  doc.addPage();
  renderHeader(2, 2);

  currentY = margin + 30;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('2. ÉTAT DÉTAILLÉ NOMINATIF DES FACTURES D\'EAU (SUITE & CLÔTURE)', margin, currentY);
  currentY += 4;

  renderTableHeader(currentY);
  currentY += 6;

  remainingFactures.forEach((f, idx) => {
    drawInvoiceRow(f, currentY, idx % 2 === 1);
    currentY += 5.2;
  });

  // Total Summary Row
  doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.rect(margin, currentY, contentWidth, 7, 'F');
  doc.setDrawColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, margin + contentWidth, currentY);
  doc.line(margin, currentY + 7, margin + contentWidth, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('TOTAUX GÉNÉRAUX DE LA PÉRIODE :', margin + 4, currentY + 4.8);

  // Totaux values
  const xConso = margin + cols[0].width + cols[1].width + cols[2].width + cols[3].width + cols[4].width;
  doc.text(`${data.totalVolumeM3.toLocaleString('fr-FR')} m³`, xConso - 2, currentY + 4.8, { align: 'right' });

  const xTTC = xConso + cols[5].width;
  doc.text(`${data.totalFactureTTC.toLocaleString('fr-FR')} F`, xTTC - 2, currentY + 4.8, { align: 'right' });

  const xPaye = xTTC + cols[6].width;
  doc.setTextColor(successEmerald[0], successEmerald[1], successEmerald[2]);
  doc.text(`${data.totalEncaisseFCFA.toLocaleString('fr-FR')} F`, xPaye - 2, currentY + 4.8, { align: 'right' });

  const xReste = xPaye + cols[7].width;
  doc.setTextColor(alertRose[0], alertRose[1], alertRose[2]);
  doc.text(`${data.totalImpayesFCFA.toLocaleString('fr-FR')} F`, xReste - 2, currentY + 4.8, { align: 'right' });

  currentY += 14;

  // Signatures & Official Approval Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('3. APPROBATION & VISAS RÉGLEMENTAIRES DE FACTURATION', margin, currentY);
  currentY += 4;

  const sigBoxW = (contentWidth - 8) / 3;
  const sigBoxH = 34;

  const signatures = [
    { title: 'Le Trésorier Général', note: 'Certifie l\'exactitude des montants et créances' },
    { title: 'Le Responsable Facturation', note: 'Vérification des index compteurs et quotas' },
    { title: 'Le Président de l\'ASUFOR', note: 'Approbation finale et mise en recouvrement' },
  ];

  signatures.forEach((sig, idx) => {
    const x = margin + idx * (sigBoxW + 4);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(x, currentY, sigBoxW, sigBoxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(sig.title, x + 4, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(sig.note, x + 4, currentY + 11);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Date & Signature :', x + 4, currentY + sigBoxH - 4);
  });

  return doc;
}

export function exportBillingReportPdf(data: BillingReportPayload): void {
  const doc = generateBillingReportPdf(data);
  const cleanOrg = data.organisationNom.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanPeriode = data.periode.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Rapport_Facturation_${cleanOrg}_${cleanPeriode}.pdf`);
}

/**
 * Génère le document PDF exhaustif du Rapport Technique de Production d'Eau & Pertes Réseau
 */
export function generateProductionReportPdf(data: ProductionReportPayload): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryNavy = [8, 47, 73] as const;
  const accentCyan = [14, 165, 233] as const;
  const successEmerald = [16, 185, 129] as const;
  const alertRose = [225, 29, 72] as const;
  const alertAmber = [217, 119, 6] as const;
  const slateDark = [30, 41, 59] as const;
  const slateLight = [241, 245, 249] as const;
  const borderGray = [226, 232, 240] as const;

  const renderHeader = (pageNumber: number, totalPages: number) => {
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.roundedRect(margin, margin, contentWidth, 24, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('FACTUREAU • RAPPORT TECHNIQUE DE PRODUCTION D\'EAU & PERTES', margin + 6, margin + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      `${data.organisationNom} • Dépt. ${data.departement} (${data.region}) • Période : ${data.periode}`,
      margin + 6,
      margin + 16
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`Balance hydraulique & NRW (Eau Non Comptabilisée)`, margin + 6, margin + 21);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Page ${pageNumber}/${totalPages}`, pageWidth - margin - 6, margin + 9, { align: 'right' });
    doc.text(`Généré le ${data.dateGeneration}`, pageWidth - margin - 6, margin + 16, { align: 'right' });
    doc.text('Audité Direction Hydraulique', pageWidth - margin - 6, margin + 21, { align: 'right' });
  };

  // --- PAGE 1: Header + Balance Hydraulique + Débit Forages ---
  renderHeader(1, 2);

  let currentY = margin + 30;

  // Macro KPIs (6 cards)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('1. BALANCE HYDRAULIQUE & RENDEMENT DU RÉSEAU DE DISTRIBUTION', margin, currentY);
  currentY += 4;

  const cardW = (contentWidth - 8) / 3;
  const cardH = 15;

  const kpisHydraulique1 = [
    { label: 'Volume Pompé (Production)', value: `${data.totalVolumeProduitM3.toLocaleString('fr-FR')} m³`, color: accentCyan },
    { label: 'Volume Facturé (Consommation)', value: `${data.totalVolumeConsommeM3.toLocaleString('fr-FR')} m³`, color: successEmerald },
    { label: 'Pertes Réseau Estimées (NRW)', value: `${data.totalPertesM3.toLocaleString('fr-FR')} m³`, color: data.tauxPertePourcent > 18 ? alertRose : alertAmber },
  ];

  const kpisHydraulique2 = [
    { label: 'Rendement Global Réseau', value: `${data.tauxRendementPourcent}%`, color: successEmerald },
    { label: 'Taux de Pertes Hydrauliques', value: `${data.tauxPertePourcent}%`, color: data.tauxPertePourcent > 18 ? alertRose : alertAmber },
    { label: 'Diagnostic Réseau', value: data.tauxPertePourcent <= 15 ? 'Conforme / Bon' : 'Alerte Fuites', color: primaryNavy },
  ];

  kpisHydraulique1.forEach((kpi, idx) => {
    const x = margin + idx * (cardW + 4);
    doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(x, currentY, cardW, cardH, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3.5, currentY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3.5, currentY + 11.5);
  });

  currentY += cardH + 3;

  kpisHydraulique2.forEach((kpi, idx) => {
    const x = margin + idx * (cardW + 4);
    doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(x, currentY, cardW, cardH, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3.5, currentY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3.5, currentY + 11.5);
  });

  currentY += cardH + 7;

  // Breakdown by Borehole
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('2. RÉPARTITION TECHNIQUE DU POMPAGE PAR FORAGE', margin, currentY);
  currentY += 4;

  // Table Forages: Nom, Type Pompe, Débit Nominal, Volume m³, Part (%)
  const colsForages = [
    { title: 'Forage / Puits', width: 55, align: 'left' as const },
    { title: 'Type Pompe', width: 35, align: 'left' as const },
    { title: 'Débit Nominal', width: 30, align: 'right' as const },
    { title: 'Volume Extrait m³', width: 35, align: 'right' as const },
    { title: 'Part (%)', width: 27, align: 'right' as const },
  ];

  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(margin, currentY, contentWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);

  let cX = margin;
  colsForages.forEach((col) => {
    const textX = col.align === 'right' ? cX + col.width - 2 : cX + 2;
    doc.text(col.title, textX, currentY + 4.2, { align: col.align });
    cX += col.width;
  });

  currentY += 6;

  data.foragesStats.forEach((fStat, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, contentWidth, 5.5, 'F');
    }
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, currentY + 5.5, margin + contentWidth, currentY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);

    let rowX = margin;
    doc.text(fStat.nom, rowX + 2, currentY + 4);
    rowX += colsForages[0].width;

    doc.setFont('helvetica', 'normal');
    doc.text(fStat.typePompe, rowX + 2, currentY + 4);
    rowX += colsForages[1].width;

    doc.text(`${fStat.debitNominal} m³/h`, rowX + colsForages[2].width - 2, currentY + 4, { align: 'right' });
    rowX += colsForages[2].width;

    doc.setFont('helvetica', 'bold');
    doc.text(`${fStat.volumeM3.toLocaleString('fr-FR')} m³`, rowX + colsForages[3].width - 2, currentY + 4, { align: 'right' });
    rowX += colsForages[3].width;

    doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    doc.text(`${fStat.partPourcent}%`, rowX + colsForages[4].width - 2, currentY + 4, { align: 'right' });

    currentY += 5.5;
  });

  currentY += 8;

  // Relevés de production journaliers / périodiques
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('3. RELEVÉS D\'INDEX COMPTEURS EN TÊTE DE FORAGE', margin, currentY);
  currentY += 4;

  const colsReleves = [
    { title: 'Date Relevé', width: 28, align: 'left' as const },
    { title: 'Forage', width: 45, align: 'left' as const },
    { title: 'Ancien Index (m³)', width: 32, align: 'right' as const },
    { title: 'Nouvel Index (m³)', width: 32, align: 'right' as const },
    { title: 'Volume Pompé (m³)', width: 25, align: 'right' as const },
    { title: 'Agent Technique', width: 20, align: 'left' as const },
  ];

  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(margin, currentY, contentWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);

  let rX = margin;
  colsReleves.forEach((col) => {
    const textX = col.align === 'right' ? rX + col.width - 2 : rX + 2;
    doc.text(col.title, textX, currentY + 4.2, { align: col.align });
    rX += col.width;
  });

  currentY += 6;

  const page1Releves = data.releves.slice(0, 16);
  const remainingReleves = data.releves.slice(16);

  page1Releves.forEach((r, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, contentWidth, 5.2, 'F');
    }
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, currentY + 5.2, margin + contentWidth, currentY + 5.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);

    let rowX = margin;
    doc.text(r.dateReleve, rowX + 2, currentY + 3.8);
    rowX += colsReleves[0].width;

    doc.setFont('helvetica', 'bold');
    doc.text(r.forageNom, rowX + 2, currentY + 3.8);
    rowX += colsReleves[1].width;

    doc.setFont('helvetica', 'normal');
    doc.text(`${r.ancienIndexM3.toLocaleString('fr-FR')}`, rowX + colsReleves[2].width - 2, currentY + 3.8, { align: 'right' });
    rowX += colsReleves[2].width;

    doc.text(`${r.nouvelIndexM3.toLocaleString('fr-FR')}`, rowX + colsReleves[3].width - 2, currentY + 3.8, { align: 'right' });
    rowX += colsReleves[3].width;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    doc.text(`${r.volumeProduitM3.toLocaleString('fr-FR')} m³`, rowX + colsReleves[4].width - 2, currentY + 3.8, { align: 'right' });
    rowX += colsReleves[4].width;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    const agentShort = r.agentNom.length > 12 ? r.agentNom.substring(0, 10) + '..' : r.agentNom;
    doc.text(agentShort, rowX + 2, currentY + 3.8);

    currentY += 5.2;
  });

  // --- PAGE 2: Suite des relevés + Diagnostic NRW + Signatures ---
  doc.addPage();
  renderHeader(2, 2);

  currentY = margin + 30;

  if (remainingReleves.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text('3. RELEVÉS D\'INDEX COMPTEURS EN TÊTE DE FORAGE (SUITE)', margin, currentY);
    currentY += 4;

    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(margin, currentY, contentWidth, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);

    let rX2 = margin;
    colsReleves.forEach((col) => {
      const textX = col.align === 'right' ? rX2 + col.width - 2 : rX2 + 2;
      doc.text(col.title, textX, currentY + 4.2, { align: col.align });
      rX2 += col.width;
    });

    currentY += 6;

    remainingReleves.forEach((r, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, contentWidth, 5.2, 'F');
      }
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, currentY + 5.2, margin + contentWidth, currentY + 5.2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);

      let rowX = margin;
      doc.text(r.dateReleve, rowX + 2, currentY + 3.8);
      rowX += colsReleves[0].width;

      doc.setFont('helvetica', 'bold');
      doc.text(r.forageNom, rowX + 2, currentY + 3.8);
      rowX += colsReleves[1].width;

      doc.setFont('helvetica', 'normal');
      doc.text(`${r.ancienIndexM3.toLocaleString('fr-FR')}`, rowX + colsReleves[2].width - 2, currentY + 3.8, { align: 'right' });
      rowX += colsReleves[2].width;

      doc.text(`${r.nouvelIndexM3.toLocaleString('fr-FR')}`, rowX + colsReleves[3].width - 2, currentY + 3.8, { align: 'right' });
      rowX += colsReleves[3].width;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
      doc.text(`${r.volumeProduitM3.toLocaleString('fr-FR')} m³`, rowX + colsReleves[4].width - 2, currentY + 3.8, { align: 'right' });
      rowX += colsReleves[4].width;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      const agentShort = r.agentNom.length > 12 ? r.agentNom.substring(0, 10) + '..' : r.agentNom;
      doc.text(agentShort, rowX + 2, currentY + 3.8);

      currentY += 5.2;
    });

    currentY += 8;
  }

  // Diagnostic Technique & Rendement Réseau
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('4. DIAGNOSTIC HYDRAULIQUE & PLAN D\'ACTION CONTRE LES FUITES', margin, currentY);
  currentY += 4;

  doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, currentY, contentWidth, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(`Indice d'Eau Non Comptabilisée (NRW) : ${data.tauxPertePourcent}% (${data.totalPertesM3.toLocaleString('fr-FR')} m³ non recouvrés)`, margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  const diagLines = [
    `• Volume injecté en réseau : ${data.totalVolumeProduitM3.toLocaleString('fr-FR')} m³ | Volume enregistré aux compteurs usagers : ${data.totalVolumeConsommeM3.toLocaleString('fr-FR')} m³.`,
    `• Évaluation technique : ${data.tauxPertePourcent <= 15 ? 'Réseau étanche et conforme aux normes OFOR (Pertes inférieures à 15%).' : 'Alerte : Pertes supérieures au seuil de tolérance de 15%. Campagne de recherche de fuite requise sur les tronçons principaux.'}`,
    `• Recommandations : Inspection nocturne de la pression statique, calibrage des compteurs en tête et contrôle des branchements sociaux.`,
    `• Énergie de pompage : Priorité au champ solaire photovoltaïque pour minimiser les coûts d'extraction au mètre cube.`,
  ];
  diagLines.forEach((line, i) => {
    doc.text(line, margin + 4, currentY + 12 + i * 4.5);
  });

  currentY += 42;

  // Signatures
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('5. CERTIFICATION & VISAS TECHNIQUES HYDRAULIQUES', margin, currentY);
  currentY += 4;

  const sigBoxW = (contentWidth - 8) / 3;
  const sigBoxH = 34;

  const signatures = [
    { title: 'Le Responsable Technique', note: 'Certifie l\'étalonnage des compteurs de tête' },
    { title: 'L\'Agent d\'Exploitation', note: 'Vérification des volumes journaliers pompés' },
    { title: 'La Direction de l\'ASUFOR', note: 'Validation du rapport de rendement hydraulique' },
  ];

  signatures.forEach((sig, idx) => {
    const x = margin + idx * (sigBoxW + 4);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(x, currentY, sigBoxW, sigBoxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(sig.title, x + 4, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(sig.note, x + 4, currentY + 11);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Date & Visa :', x + 4, currentY + sigBoxH - 4);
  });

  return doc;
}

export function exportProductionReportPdf(data: ProductionReportPayload): void {
  const doc = generateProductionReportPdf(data);
  const cleanOrg = data.organisationNom.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanPeriode = data.periode.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Rapport_Production_Eau_${cleanOrg}_${cleanPeriode}.pdf`);
}

/**
 * Exporte l'état détaillé de Facturation au format CSV pour Excel (BOM UTF-8, séparateur point-virgule)
 */
export function exportBillingReportCsv(data: BillingReportPayload): void {
  const BOM = '\uFEFF';
  const sep = ';';
  const escape = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const metaRows = [
    [escape('RAPPORT OFFICIEL DE FACTURATION D\'EAU'), escape(data.organisationNom)],
    [escape('Période'), escape(data.periode)],
    [escape('Périmètre Forage'), escape(data.forageNom)],
    [escape('Date d\'extraction'), escape(data.dateGeneration)],
    [escape('Total Facturé TTC (FCFA)'), escape(data.totalFactureTTC)],
    [escape('Recettes Encaissées (FCFA)'), escape(data.totalEncaisseFCFA)],
    [escape('Créances Impayées (FCFA)'), escape(data.totalImpayesFCFA)],
    [escape('Volume Total Facturé (m³)'), escape(data.totalVolumeM3)],
    [escape('Taux de Recouvrement'), escape(`${data.tauxRecouvrement}%`)],
    [],
  ];

  const headers = [
    'N° Facture',
    'Code Abonné',
    'Nom & Prénom Usager',
    'Quartier',
    'Consommation (m³)',
    'Total TTC (FCFA)',
    'Montant Encaissé (FCFA)',
    'Reste Dû (FCFA)',
    'Statut',
    'Date Émission',
    'Date Échéance',
  ];

  const rows = data.factures.map((f) =>
    [
      escape(f.numeroFacture),
      escape(f.abonneCode),
      escape(f.abonneNom),
      escape(f.abonneQuartier || 'Centre'),
      escape(f.consommationM3),
      escape(f.totalTTCFCFA),
      escape(f.montantPayeFCFA),
      escape(f.resteDuFCFA),
      escape(f.statut),
      escape(f.dateEmission),
      escape(f.dateEcheance),
    ].join(sep)
  );

  const csvContent =
    BOM +
    metaRows.map((r) => r.join(sep)).join('\r\n') +
    '\r\n' +
    headers.map(escape).join(sep) +
    '\r\n' +
    rows.join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const cleanOrg = data.organisationNom.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanPeriode = data.periode.replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute('download', `Rapport_Facturation_${cleanOrg}_${cleanPeriode}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporte le rapport technique de Production d'eau au format CSV pour tableur
 */
export function exportProductionReportCsv(data: ProductionReportPayload): void {
  const BOM = '\uFEFF';
  const sep = ';';
  const escape = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const metaRows = [
    [escape('RAPPORT TECHNIQUE DE PRODUCTION D\'EAU & PERTES RÉSEAU'), escape(data.organisationNom)],
    [escape('Période'), escape(data.periode)],
    [escape('Périmètre Forage'), escape(data.forageNom)],
    [escape('Date d\'extraction'), escape(data.dateGeneration)],
    [escape('Volume Total Produit (m³)'), escape(data.totalVolumeProduitM3)],
    [escape('Volume Total Facturé (m³)'), escape(data.totalVolumeConsommeM3)],
    [escape('Volume Pertes Réseau (m³)'), escape(data.totalPertesM3)],
    [escape('Taux de Rendement Réseau'), escape(`${data.tauxRendementPourcent}%`)],
    [escape('Taux de Pertes (NRW)'), escape(`${data.tauxPertePourcent}%`)],
    [],
    [escape('--- RÉPARTITION PAR FORAGE ---')],
    [escape('Forage'), escape('Type Pompe'), escape('Débit (m³/h)'), escape('Volume (m³)'), escape('Part (%)')],
    ...data.foragesStats.map((fs) => [
      escape(fs.nom),
      escape(fs.typePompe),
      escape(fs.debitNominal),
      escape(fs.volumeM3),
      escape(`${fs.partPourcent}%`),
    ]),
    [],
    [escape('--- RELEVÉS DES COMPTEURS EN TÊTE DE FORAGE ---')],
  ];

  const headers = [
    'Date Relevé',
    'Forage',
    'Ancien Index (m³)',
    'Nouvel Index (m³)',
    'Volume Produit (m³)',
    'Agent Releveur',
  ];

  const rows = data.releves.map((r) =>
    [
      escape(r.dateReleve),
      escape(r.forageNom),
      escape(r.ancienIndexM3),
      escape(r.nouvelIndexM3),
      escape(r.volumeProduitM3),
      escape(r.agentNom),
    ].join(sep)
  );

  const csvContent =
    BOM +
    metaRows.map((r) => r.join(sep)).join('\r\n') +
    '\r\n' +
    headers.map(escape).join(sep) +
    '\r\n' +
    rows.join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const cleanOrg = data.organisationNom.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanPeriode = data.periode.replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute('download', `Rapport_Production_Eau_${cleanOrg}_${cleanPeriode}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

