import { jsPDF } from 'jspdf';
import { Facture, Abonne, Forage, Organisation, Compteur } from '../types';
import { store } from './store';
import { formatFCFA, formatNumberDot } from '../utils/formatters';

export interface InvoicePdfOptions {
  organisation?: Organisation | null;
  abonne?: Abonne | null;
  forage?: Forage | null;
  compteur?: Compteur | null;
}

/**
 * Converts a positive number to French words for official invoice certification.
 */
function numberToFrenchWords(n: number): string {
  if (n === 0) return 'zéro';
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];

  function convertTens(num: number): string {
    if (num < 10) return units[num];
    if (num >= 10 && num < 20) return teens[num - 10];
    const ten = Math.floor(num / 10);
    const rest = num % 10;
    if (ten === 7) {
      return `soixante-${rest === 1 ? 'et-onze' : teens[rest]}`;
    }
    if (ten === 9) {
      return `quatre-vingt-${teens[rest]}`;
    }
    if (rest === 0) return tens[ten];
    if (rest === 1 && ten < 8) return `${tens[ten]}-et-un`;
    return `${tens[ten]}-${units[rest]}`;
  }

  function convertHundreds(num: number): string {
    let str = '';
    const h = Math.floor(num / 100);
    const rest = num % 100;
    if (h > 0) {
      if (h === 1) {
        str += 'cent';
      } else {
        str += `${units[h]} cent${rest === 0 ? 's' : ''}`;
      }
      if (rest > 0) str += ' ';
    }
    if (rest > 0) {
      str += convertTens(rest);
    }
    return str;
  }

  const rounded = Math.round(n);
  if (rounded >= 1000000) {
    const millions = Math.floor(rounded / 1000000);
    const restM = rounded % 1000000;
    let res = `${millions > 1 ? convertHundreds(millions) + ' millions' : 'un million'}`;
    if (restM > 0) res += ` ${numberToFrenchWords(restM)}`;
    return res;
  }

  if (rounded >= 1000) {
    const thousands = Math.floor(rounded / 1000);
    const restT = rounded % 1000;
    let res = thousands === 1 ? 'mille' : `${convertHundreds(thousands)} mille`;
    if (restT > 0) res += ` ${convertHundreds(restT)}`;
    return res;
  }

  return convertHundreds(rounded);
}

/**
 * Generates an official, certified printable A4 Water Invoice PDF for FACTUREAU.
 */
export function generateInvoicePdf(facture: Facture, options?: InvoicePdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currentOrg = store.getCurrentOrganisation();
  const orgNom = options?.organisation?.nom || currentOrg?.nom || 'ASUFOR DE TOUBA TOUL';
  const orgRegion = options?.organisation?.region || currentOrg?.region || 'Thiès';
  const orgDept = options?.organisation?.departement || currentOrg?.departement || 'Tivaouane';
  const orgTel = options?.organisation?.contactTel || currentOrg?.contactTel || '+221 33 951 12 34';
  const orgEmail = options?.organisation?.contactEmail || currentOrg?.contactEmail || 'contact@asufor-toubatoul.sn';

  const abonne = options?.abonne || store.getAbonnes().find((a) => a.id === facture.abonneId);
  const forage = options?.forage || store.getForages().find((f) => f.id === facture.forageId);
  const compteur = options?.compteur || store.getCompteurs().find((c) => c.id === abonne?.compteurId);

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const navyDark = [8, 47, 73] as const; // #082F49
  const blueMedium = [3, 105, 161] as const; // #0369A1
  const cyanAccent = [6, 182, 212] as const; // #06B6D4
  const emeraldSuccess = [5, 150, 105] as const; // #059669
  const amberPending = [217, 119, 6] as const; // #D97706
  const roseAlert = [225, 29, 72] as const; // #E11D48
  const slateDark = [30, 41, 59] as const; // #1E293B
  const slateMuted = [100, 116, 139] as const; // #64748B
  const grayBg = [248, 250, 252] as const; // #F8FAFC
  const borderGray = [226, 232, 240] as const; // #E2E8F0

  let currentY = margin;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. INSTITUTIONAL TOP HEADER (République du Sénégal & DGPRE/OFOR)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setFillColor(grayBg[0], grayBg[1], grayBg[2]);
  doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD');

  // Left Republic Seal Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('RÉPUBLIQUE DU SÉNÉGAL', margin + 4, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Ministère de l\'Hydraulique et de l\'Assainissement', margin + 4, currentY + 9.5);
  doc.text('Direction de la Gestion et de la Planification des Ressources en Eau (DGPRE)', margin + 4, currentY + 13.5);
  doc.text('Office des Forages Ruraux (OFOR) • Programme PEPAM', margin + 4, currentY + 17.5);

  // Vertical Separator
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.line(margin + 105, currentY + 2.5, margin + 105, currentY + 19.5);

  // Right Association Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(blueMedium[0], blueMedium[1], blueMedium[2]);
  doc.text(orgNom.toUpperCase(), margin + 110, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`Région : ${orgRegion} • Département : ${orgDept}`, margin + 110, currentY + 9.5);
  doc.text(`Tél : ${orgTel} • Email : ${orgEmail}`, margin + 110, currentY + 13.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(emeraldSuccess[0], emeraldSuccess[1], emeraldSuccess[2]);
  doc.text('ASUFOR Agréée • Code Exploitant : AG-OFOR-2026-08', margin + 110, currentY + 17.5);

  currentY += 24.5;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. MAIN INVOICE TITLE BANNER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.roundedRect(margin, currentY, contentWidth, 18, 2.5, 2.5, 'F');

  // Left Banner text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('FACTURE D\'EAU POTABLE & QUITTANCE D\'USAGE', margin + 6, currentY + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(cyanAccent[0], cyanAccent[1], cyanAccent[2]);
  doc.text(
    `Document officiel conforme au Code de l'Eau • Période de facturation : ${facture.periode.toUpperCase()}`,
    margin + 6,
    currentY + 13.5
  );

  // Status Badge on Right
  const isPayee = facture.statut === 'PAYEE';
  const isPartiel = facture.statut === 'PARTIELLEMENT_PAYEE';
  const isRetard = facture.statut === 'EN_RETARD';

  const badgeBg = isPayee ? emeraldSuccess : isPartiel ? blueMedium : isRetard ? roseAlert : amberPending;
  const badgeLabel = isPayee ? 'FACTURE SOLDÉE' : isPartiel ? 'PARTIELLEMENT RÉGLÉE' : isRetard ? 'EN SOUFFRANCE' : 'NON SOLDÉE';

  const badgeW = 38;
  const badgeH = 8;
  const badgeX = margin + contentWidth - badgeW - 5;
  const badgeY = currentY + 5;

  doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(badgeLabel, badgeX + badgeW / 2, badgeY + 5.2, { align: 'center' });

  currentY += 21;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. TWO INFORMATION PANELS (Left: Invoice Refs, Right: Subscriber)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const panelW = (contentWidth - 4) / 2;
  const panelH = 39;

  // --- Left Panel: Références de Facture ---
  doc.setFillColor(grayBg[0], grayBg[1], grayBg[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, currentY, panelW, panelH, 2, 2, 'FD');

  // Header band
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, panelW, 6.5, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('RÉFÉRENCES DE LA FACTURE', margin + 3.5, currentY + 4.5);

  const leftTextY = currentY + 10.5;
  doc.setFontSize(7);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('N° de Facture :', margin + 3.5, leftTextY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text(facture.numeroFacture, margin + 35, leftTextY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Période facturée :', margin + 3.5, leftTextY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(facture.periode, margin + 35, leftTextY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Date d\'émission :', margin + 3.5, leftTextY + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(facture.dateEmission, margin + 35, leftTextY + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Date limite (échéance) :', margin + 3.5, leftTextY + 15.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(roseAlert[0], roseAlert[1], roseAlert[2]);
  doc.text(`${facture.dateEcheance} (stricte)`, margin + 35, leftTextY + 15.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Ouvrage de production :', margin + 3.5, leftTextY + 20.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(blueMedium[0], blueMedium[1], blueMedium[2]);
  doc.text(forage ? `${forage.nom} (${forage.code})` : 'Forage principal', margin + 35, leftTextY + 20.5);

  // --- Right Panel: Abonné & Branchement ---
  const rightPanelX = margin + panelW + 4;
  doc.setFillColor(grayBg[0], grayBg[1], grayBg[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(rightPanelX, currentY, panelW, panelH, 2, 2, 'FD');

  // Header band
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(rightPanelX, currentY, panelW, 6.5, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('IDENTIFICATION DE L\'ABONNÉ / USAGER', rightPanelX + 3.5, currentY + 4.5);

  const rightTextY = currentY + 10.5;
  doc.setFontSize(7);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Code Usager :', rightPanelX + 3.5, rightTextY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(blueMedium[0], blueMedium[1], blueMedium[2]);
  doc.text(facture.abonneCode || abonne?.codeAbonne || 'ABN-000', rightPanelX + 35, rightTextY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Nom & Prénom :', rightPanelX + 3.5, rightTextY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(facture.abonneNom || `${abonne?.nom} ${abonne?.prenom}`, rightPanelX + 35, rightTextY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Téléphone mobile :', rightPanelX + 3.5, rightTextY + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(facture.abonneTel || abonne?.telephone || 'Non renseigné', rightPanelX + 35, rightTextY + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Quartier / Desserte :', rightPanelX + 3.5, rightTextY + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`${facture.abonneQuartier || abonne?.quartier || 'Centre'} (${abonne?.adresse || 'ASUFOR'})`, rightPanelX + 35, rightTextY + 15.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Catégorie tarifaire :', rightPanelX + 3.5, rightTextY + 20.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text(`${abonne?.categorie || 'DOMESTIQUE'} • Compteur : ${compteur?.numeroSerie || 'CPT-STD-01'}`, rightPanelX + 35, rightTextY + 20.5);

  currentY += panelH + 3.5;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. WATER METER CONSUMPTION BREAKDOWN (INDEX BOXES)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('RELEVÉ D\'INDEX & VOLUMÉTRIE CONSOMMÉE', margin, currentY + 3);

  currentY += 4.5;

  const meterBoxW = (contentWidth - 6) / 4;
  const meterBoxH = 14;

  const meterKpis = [
    { label: 'ANCIEN INDEX (m³)', val: `${formatNumberDot(facture.ancienIndex)} m³`, sub: 'Index début de période', color: slateDark },
    { label: 'NOUVEL INDEX (m³)', val: `${formatNumberDot(facture.nouvelIndex)} m³`, sub: 'Index relevé clôture', color: slateDark },
    { label: 'VOLUME FACTURÉ', val: `${formatNumberDot(facture.consommationM3)} m³`, sub: 'Consommation nette', color: blueMedium },
    { label: 'PRIX UNITAIRE APPLIQUÉ', val: `${formatNumberDot(facture.prixUnitaireFCFA)} F/m³`, sub: 'Tarif délibéré ASUFOR', color: emeraldSuccess },
  ];

  meterKpis.forEach((kpi, idx) => {
    const x = margin + idx * (meterBoxW + 2);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(x, currentY, meterBoxW, meterBoxH, 1.8, 1.8, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(kpi.label, x + 3, currentY + 3.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, x + 3, currentY + 8.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(kpi.sub, x + 3, currentY + 12.3);
  });

  currentY += meterBoxH + 4;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. OFFICIAL FINANCIAL DECOMPTE TABLE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('DÉCOMPTE FINANCIER & LIQUIDATION DU MONTANT DÛ', margin, currentY + 3);

  currentY += 4.5;

  // Table header
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(margin, currentY, contentWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('DÉSIGNATION DE LA PRESTATION D\'EAU', margin + 3.5, currentY + 4.2);
  doc.text('BASE DE CALCUL', margin + 105, currentY + 4.2);
  doc.text('TARIF UNITAIRE', margin + 140, currentY + 4.2, { align: 'right' });
  doc.text('MONTANT NET', margin + contentWidth - 3.5, currentY + 4.2, { align: 'right' });

  currentY += 6;

  // Lines
  const tableRows = [
    {
      desc: 'Fourniture d\'eau potable (Consommation volumique)',
      detail: `${facture.consommationM3} m³ d'eau distribuée au robinet`,
      unit: `${formatNumberDot(facture.prixUnitaireFCFA)} FCFA / m³`,
      total: formatFCFA(facture.montantConsommationFCFA),
      bg: [255, 255, 255],
    },
    {
      desc: 'Redevance fixe mensuelle d\'abonnement & entretien',
      detail: 'Maintenance préventive électropompe & réseau',
      unit: 'Forfait mensuel',
      total: formatFCFA(facture.redevanceFixeFCFA),
      bg: [248, 250, 252],
    },
    {
      desc: 'Taxe sur la Valeur Ajoutée (TVA)',
      detail: 'Régime d\'exonération rurale (TVA 0% - Code Général des Impôts)',
      unit: '0.00 %',
      total: formatFCFA(facture.tvaFCFA || 0),
      bg: [255, 255, 255],
    },
  ];

  tableRows.forEach((row) => {
    doc.setFillColor(row.bg[0], row.bg[1], row.bg[2]);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.line(margin, currentY + 7, margin + contentWidth, currentY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(row.desc, margin + 3.5, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(row.detail, margin + 105, currentY + 4.5);

    doc.text(row.unit, margin + 140, currentY + 4.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
    doc.text(row.total, margin + contentWidth - 3.5, currentY + 4.5, { align: 'right' });

    currentY += 7;
  });

  // Table Totals Box
  currentY += 1.5;
  const totalsBoxH = 26;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin + contentWidth - 92, currentY, 92, totalsBoxH, 2, 2, 'FD');

  const totX = margin + contentWidth - 90;
  const valX = margin + contentWidth - 3.5;

  // Total TTC
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('TOTAL FACTURÉ TOUTES TAXES COMPRISES :', totX + 2, currentY + 5.5);
  doc.setFontSize(8.5);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text(formatFCFA(facture.totalTTCFCFA), valX, currentY + 5.5, { align: 'right' });

  // Montant déjà réglé
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(emeraldSuccess[0], emeraldSuccess[1], emeraldSuccess[2]);
  doc.text('Acompte ou paiement perçu :', totX + 2, currentY + 11.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`- ${formatFCFA(facture.montantPayeFCFA)}`, valX, currentY + 11.5, { align: 'right' });

  // Divider
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.line(totX + 2, currentY + 14.5, valX, currentY + 14.5);

  // NET RESTANT DÛ
  const resteAmount = facture.resteDuFCFA;
  const isZero = resteAmount === 0;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(isZero ? emeraldSuccess[0] : roseAlert[0], isZero ? emeraldSuccess[1] : roseAlert[1], isZero ? emeraldSuccess[2] : roseAlert[2]);
  doc.text('NET RESTANT DÛ :', totX + 2, currentY + 20.5);

  doc.setFontSize(11);
  doc.text(formatFCFA(resteAmount), valX, currentY + 20.5, { align: 'right' });

  // Left explanation: Montant en toutes lettres
  const wordsW = contentWidth - 96;
  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(254, 240, 138);
  doc.roundedRect(margin, currentY, wordsW, totalsBoxH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(161, 98, 7);
  doc.text('ARRÊTÉ DU MONTANT DE LA FACTURE :', margin + 3.5, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  const wordsText = `Arrêtée la présente facture à la somme de : ${numberToFrenchWords(facture.totalTTCFCFA)} Francs CFA (${formatFCFA(facture.totalTTCFCFA)}).`;
  const splitWords = doc.splitTextToSize(wordsText, wordsW - 7);
  doc.text(splitWords, margin + 3.5, currentY + 10);

  doc.setFontSize(6.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Facture certifiée exécutoire par le bureau de l\'ASUFOR.', margin + 3.5, currentY + 21);

  currentY += totalsBoxH + 4.5;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. PAYMENT INSTRUCTIONS & VERIFICATION QR CODE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const payCardH = 26;
  doc.setFillColor(grayBg[0], grayBg[1], grayBg[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, currentY, contentWidth, payCardH, 2, 2, 'FD');

  // Simulated Vector QR Code Card on Left
  const qrBoxSize = 20;
  const qrX = margin + 3.5;
  const qrY = currentY + 3;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(qrX, qrY, qrBoxSize, qrBoxSize, 1.5, 1.5, 'FD');

  // Draw simulated QR matrix pattern
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  // Corner 1
  doc.rect(qrX + 2, qrY + 2, 5, 5, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX + 3, qrY + 3, 3, 3, 'F');
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(qrX + 3.7, qrY + 3.7, 1.6, 1.6, 'F');

  // Corner 2
  doc.rect(qrX + 13, qrY + 2, 5, 5, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX + 14, qrY + 3, 3, 3, 'F');
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(qrX + 14.7, qrY + 3.7, 1.6, 1.6, 'F');

  // Corner 3
  doc.rect(qrX + 2, qrY + 13, 5, 5, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX + 3, qrY + 14, 3, 3, 'F');
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(qrX + 3.7, qrY + 14.7, 1.6, 1.6, 'F');

  // Simulated inner data dots
  doc.rect(qrX + 9, qrY + 3, 2, 2, 'F');
  doc.rect(qrX + 8, qrY + 7, 3, 2, 'F');
  doc.rect(qrX + 13, qrY + 9, 2, 3, 'F');
  doc.rect(qrX + 9, qrY + 11, 2, 2, 'F');
  doc.rect(qrX + 8, qrY + 15, 3, 2, 'F');
  doc.rect(qrX + 14, qrY + 14, 3, 2, 'F');
  doc.rect(qrX + 10, qrY + 17, 2, 1.5, 'F');

  // Payment text details
  const payTextX = qrX + qrBoxSize + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('MODALITÉS DE RÈGLEMENT PAR MOBILE MONEY (WAVE / ORANGE MONEY)', payTextX, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('1. Ouvrez l\'application Wave ou Orange Money sur votre téléphone.', payTextX, currentY + 10);
  doc.text('2. Effectuez un paiement vers le compte marchand ASUFOR ou scannez le QR code de cette facture.', payTextX, currentY + 14);
  doc.text(`3. Référence obligatoire à inscrire : ${facture.numeroFacture} (ou code ${facture.abonneCode}).`, payTextX, currentY + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(emeraldSuccess[0], emeraldSuccess[1], emeraldSuccess[2]);
  doc.text('✓ Quittance électronique sécurisée délivrée automatiquement par SMS dès encaissement.', payTextX, currentY + 22.5);

  currentY += payCardH + 4;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. OFFICIAL STAMPS & SIGNATURES BLOCK
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const stampW = (contentWidth - 6) / 3;
  const stampH = 22;

  // Box 1: Le Trésorier
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, currentY, stampW, stampH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('LE TRÉSORIER GÉNÉRAL DE L\'ASUFOR', margin + 3.5, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('Visa de vérification des écritures', margin + 3.5, currentY + 8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('Fatou Ndiaye • Certifié conforme', margin + 3.5, currentY + 18);

  // Box 2: Le Président du Comité
  const stamp2X = margin + stampW + 3;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(stamp2X, currentY, stampW, stampH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('LE PRÉSIDENT DU COMITÉ ASUFOR', stamp2X + 3.5, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('Bon pour émission & recouvrement', stamp2X + 3.5, currentY + 8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('Amadou Diop • Signé le ' + facture.dateEmission, stamp2X + 3.5, currentY + 18);

  // Box 3: Sceau Institutionnel DGPRE/OFOR
  const stamp3X = stamp2X + stampW + 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(stamp3X, currentY, stampW, stampH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(blueMedium[0], blueMedium[1], blueMedium[2]);
  doc.text('SCEAU D\'INTÉGRITÉ NUMÉRIQUE', stamp3X + 3.5, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Plateforme FACTUREAU Sénégal', stamp3X + 3.5, currentY + 8);
  doc.text('ID Sécurité : SN-ASUFOR-' + facture.numeroFacture, stamp3X + 3.5, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(emeraldSuccess[0], emeraldSuccess[1], emeraldSuccess[2]);
  doc.text('Document Officiel • Page 1/1', stamp3X + 3.5, currentY + 18);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8. LEGAL FOOTER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const footerY = pageHeight - margin + 2;
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.line(margin, footerY - 4, margin + contentWidth, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(
    'FACTUREAU • Système National de Gestion & Télé-facturation Hydraulique • Conforme aux lois sénégalaises N° 81-13 et directives OFOR.',
    margin,
    footerY
  );
  doc.text(
    `Édité le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • N° ${facture.numeroFacture}`,
    margin + contentWidth,
    footerY,
    { align: 'right' }
  );

  return doc;
}

/**
 * Downloads the printable invoice as a PDF file with an intuitive, standardized name.
 */
export function downloadInvoicePdf(facture: Facture, options?: InvoicePdfOptions): void {
  const doc = generateInvoicePdf(facture, options);
  const cleanAbonne = (facture.abonneNom || 'Abonne').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Facture_${facture.numeroFacture}_${cleanAbonne}.pdf`;
  doc.save(filename);
}
