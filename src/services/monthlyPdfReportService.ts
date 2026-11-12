import { jsPDF } from 'jspdf';

export interface MonthlyFinancialReportPayload {
  mois: string; // "YYYY-MM"
  formattedMonthFr: string; // "Novembre 2026"
  organisationNom: string;
  departement: string;
  region: string;
  forages: Array<{ id: string; nom: string }>;
  factures: Array<{
    id: string;
    numeroFacture: string;
    abonneNom: string;
    abonneCode: string;
    consommationM3: number;
    totalTTCFCFA: number;
    montantPayeFCFA: number;
    resteDuFCFA: number;
    statut: string;
    dateEmission: string;
    dateEcheance: string;
  }>;
  totalFactureTTC: number;
  totalFactureM3: number;
  totalImpayesFactures: number;
  facturesPayeesCount: number;
  tauxRecouvrement: number;
  paiements: Array<{
    id: string;
    numeroFacture: string;
    recuNumero: string;
    abonneNom: string;
    montantFCFA: number;
    modePaiement: string;
    datePaiement: string;
  }>;
  totalRecettes: number;
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
    dateDepense: string;
    valideParNom?: string;
  }>;
  totalDepenses: number;
  depensesParCategorie: Record<string, number>;
  margeNetteExploitation: number;
  production: Array<{
    id: string;
    forageNom: string;
    volumeProduitM3: number;
  }>;
  totalVolumeProduitM3: number;
  comptes: Array<{
    id: string;
    nom: string;
    type: string;
    soldeActuelFCFA: number;
  }>;
  totalSoldeTresorerie: number;
  agentNom: string;
  agentRole: string;
}

export function generateMonthlyFinancialReportPdf(data: MonthlyFinancialReportPayload): jsPDF {
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
  const amber = [217, 119, 6]; // #D97706
  const textDark = [30, 41, 59]; // #1E293B
  const textMuted = [100, 116, 139]; // #64748B
  const bgLight = [248, 250, 252]; // #F8FAFC
  const borderLight = [226, 232, 240]; // #E2E8F0

  // ==================== PAGE 1 : SYNTHÈSE & FACTURES & PAIEMENTS ====================
  // 1. TOP HEADER BRANDING BAR
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.roundedRect(margin, 12, contentWidth, 25, 3, 3, 'F');

  // Accent gradient line
  doc.setFillColor(cyan[0], cyan[1], cyan[2]);
  doc.rect(margin, 36, contentWidth, 1.2, 'F');

  // Logo text & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('FACTUREAU', margin + 6, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(165, 243, 252);
  doc.text("L'eau bien gérée, l'avenir assuré - Gestion Financière & Forages", margin + 6, 29);

  // Right Header Tag
  doc.setFillColor(12, 74, 117);
  doc.roundedRect(pageWidth - margin - 72, 15, 66, 18, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('RAPPORT FINANCIER MENSUEL', pageWidth - margin - 69, 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(224, 242, 254);
  doc.text(`Période : ${data.formattedMonthFr}`, pageWidth - margin - 69, 26);
  doc.text(`Code : FIN-${data.mois.replace('-', '')}`, pageWidth - margin - 69, 30.5);

  // Context sub-header
  let currentY = 42;
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`${data.organisationNom} (Dép. ${data.departement}, Région de ${data.region})`, margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const genDateStr = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Document officiel de synthèse financière mensuelle - Émis le ${genDateStr} par ${data.agentNom} (${data.agentRole})`, margin, currentY + 4.5);

  // 2. MACRO FINANCIAL KPIS (4 Top Cards)
  currentY += 10;
  const boxW = (contentWidth - 9) / 4;
  const boxH = 17;

  // Box 1: Total Facturé
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(margin, currentY, boxW, boxH, 2, 2, 'FD');
  doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.rect(margin, currentY, 2, boxH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('TOTAL FACTURÉ (TTC)', margin + 4, currentY + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.text(`${data.totalFactureTTC.toLocaleString('fr-FR')} F`, margin + 4, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`${data.factures.length} factures (${data.totalFactureM3} m³)`, margin + 4, currentY + 15);

  // Box 2: Total Recettes
  const box2X = margin + boxW + 3;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(box2X, currentY, boxW, boxH, 2, 2, 'FD');
  doc.setFillColor(emerald[0], emerald[1], emerald[2]);
  doc.rect(box2X, currentY, 2, boxH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('RECETTES ENCAISSÉES', box2X + 4, currentY + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(emerald[0], emerald[1], emerald[2]);
  doc.text(`${data.totalRecettes.toLocaleString('fr-FR')} F`, box2X + 4, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Taux recouvrement : ${data.tauxRecouvrement}%`, box2X + 4, currentY + 15);

  // Box 3: Total Dépenses
  const box3X = box2X + boxW + 3;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(box3X, currentY, boxW, boxH, 2, 2, 'FD');
  doc.setFillColor(rose[0], rose[1], rose[2]);
  doc.rect(box3X, currentY, 2, boxH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('DÉPENSES VALIDÉES', box3X + 4, currentY + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(rose[0], rose[1], rose[2]);
  doc.text(`${data.totalDepenses.toLocaleString('fr-FR')} F`, box3X + 4, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`${data.depenses.length} décaissements`, box3X + 4, currentY + 15);

  // Box 4: Marge Nette d'Exploitation
  const box4X = box3X + boxW + 3;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(box4X, currentY, boxW, boxH, 2, 2, 'FD');
  const isMargePositive = data.margeNetteExploitation >= 0;
  const margeColor = isMargePositive ? emerald : rose;
  doc.setFillColor(margeColor[0], margeColor[1], margeColor[2]);
  doc.rect(box4X, currentY, 2, boxH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("RÉSULTAT D'EXPLOITATION", box4X + 4, currentY + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(margeColor[0], margeColor[1], margeColor[2]);
  const margeSign = data.margeNetteExploitation > 0 ? '+' : '';
  doc.text(`${margeSign}${data.margeNetteExploitation.toLocaleString('fr-FR')} F`, box4X + 4, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Recettes - Dépenses', box4X + 4, currentY + 15);

  // 3. SECTION 1: DÉTAIL DES FACTURES DU MOIS
  currentY += 23;
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(margin, currentY, 3, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(`1. DÉTAIL DES FACTURES DU MOIS (${data.factures.length} factures émises)`, margin + 5, currentY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    `Impayés : ${data.totalImpayesFactures.toLocaleString('fr-FR')} FCFA | Payées : ${data.facturesPayeesCount}/${data.factures.length}`,
    pageWidth - margin - 75,
    currentY + 4
  );

  currentY += 7;

  // Table Factures Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('N° FACTURE', margin + 2, currentY + 3.8);
  doc.text('CODE', margin + 32, currentY + 3.8);
  doc.text('ABONNÉ / USAGER', margin + 48, currentY + 3.8);
  doc.text('CONSO', margin + 98, currentY + 3.8);
  doc.text('TOTAL TTC', margin + 116, currentY + 3.8);
  doc.text('RESTE DÛ', margin + 142, currentY + 3.8);
  doc.text('STATUT', margin + 164, currentY + 3.8);

  currentY += 5.5;

  if (data.factures.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Aucune facture enregistrée pour ce mois.', margin + 4, currentY + 4);
    currentY += 7;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    data.factures.slice(0, 9).forEach((f, idx) => {
      const rowY = currentY + idx * 4.8;
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, rowY - 0.8, contentWidth, 4.8, 'F');
      }
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(f.numeroFacture, margin + 2, rowY + 2.6);
      doc.text(f.abonneCode || '-', margin + 32, rowY + 2.6);
      doc.text(f.abonneNom.substring(0, 24), margin + 48, rowY + 2.6);
      doc.text(`${f.consommationM3} m³`, margin + 98, rowY + 2.6);
      doc.text(`${f.totalTTCFCFA.toLocaleString('fr-FR')} F`, margin + 116, rowY + 2.6);

      if (f.resteDuFCFA > 0) {
        doc.setTextColor(rose[0], rose[1], rose[2]);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(emerald[0], emerald[1], emerald[2]);
      }
      doc.text(`${f.resteDuFCFA.toLocaleString('fr-FR')} F`, margin + 142, rowY + 2.6);
      doc.setFont('helvetica', 'normal');

      // Statut badge text
      if (f.statut === 'PAYEE') {
        doc.setTextColor(emerald[0], emerald[1], emerald[2]);
        doc.text('Payée', margin + 164, rowY + 2.6);
      } else if (f.statut === 'EN_RETARD') {
        doc.setTextColor(rose[0], rose[1], rose[2]);
        doc.text('Retard', margin + 164, rowY + 2.6);
      } else {
        doc.setTextColor(amber[0], amber[1], amber[2]);
        doc.text('Non payée', margin + 164, rowY + 2.6);
      }
    });
    currentY += Math.min(data.factures.length, 9) * 4.8 + 3;
  }

  // 4. SECTION 2: DÉTAIL DES PAIEMENTS & ENCAISSEMENTS DU MOIS
  currentY += 4;
  doc.setFillColor(emerald[0], emerald[1], emerald[2]);
  doc.rect(margin, currentY, 3, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(`2. DÉTAIL DES PAIEMENTS & ENCAISSEMENTS (${data.paiements.length} transactions)`, margin + 5, currentY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    `Wave: ${data.paiementsParMode.wave.toLocaleString('fr-FR')} F | OM: ${data.paiementsParMode.orangeMoney.toLocaleString('fr-FR')} F | Espèces: ${data.paiementsParMode.especes.toLocaleString('fr-FR')} F`,
    pageWidth - margin - 85,
    currentY + 4
  );

  currentY += 7;

  // Table Paiements Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('DATE / HEURE', margin + 2, currentY + 3.8);
  doc.text('N° REÇU', margin + 30, currentY + 3.8);
  doc.text('ABONNÉ / CLIENT', margin + 55, currentY + 3.8);
  doc.text('N° FACTURE', margin + 105, currentY + 3.8);
  doc.text('CANAL', margin + 138, currentY + 3.8);
  doc.text('MONTANT', margin + 162, currentY + 3.8);

  currentY += 5.5;

  if (data.paiements.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Aucun paiement encaissé sur cette période.', margin + 4, currentY + 4);
    currentY += 7;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    data.paiements.slice(0, 9).forEach((p, idx) => {
      const rowY = currentY + idx * 4.8;
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, rowY - 0.8, contentWidth, 4.8, 'F');
      }
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(p.datePaiement, margin + 2, rowY + 2.6);
      doc.text(p.recuNumero || '-', margin + 30, rowY + 2.6);
      doc.text(p.abonneNom.substring(0, 24), margin + 55, rowY + 2.6);
      doc.text(p.numeroFacture || '-', margin + 105, rowY + 2.6);
      doc.text(p.modePaiement.replace('_', ' '), margin + 138, rowY + 2.6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(emerald[0], emerald[1], emerald[2]);
      doc.text(`${p.montantFCFA.toLocaleString('fr-FR')} F`, margin + 162, rowY + 2.6);
      doc.setFont('helvetica', 'normal');
    });
    currentY += Math.min(data.paiements.length, 9) * 4.8 + 2;
  }

  // Footer Page 1
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    `FACTUREAU V3.0 SaaS - Rapport Financier Mensuel : ${data.formattedMonthFr} | Suite en Page 2`,
    margin,
    pageHeight - 8
  );
  doc.text('Page 1 / 2', pageWidth - margin - 15, pageHeight - 8);

  // ==================== PAGE 2 : DÉPENSES & TRÉSORERIE & VISAS ====================
  doc.addPage();

  // Page 2 Running Header
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.roundedRect(margin, 12, contentWidth, 14, 2, 2, 'F');
  doc.setFillColor(cyan[0], cyan[1], cyan[2]);
  doc.rect(margin, 25, contentWidth, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`FACTUREAU - Rapport Financier Mensuel : ${data.formattedMonthFr}`, margin + 5, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(165, 243, 252);
  doc.text(`Organisation : ${data.organisationNom} | Page 2 : Dépenses & Clôture de Trésorerie`, margin + 5, 24);

  currentY = 32;

  // 5. SECTION 3: DÉTAIL DES DÉPENSES & DÉCAISSEMENTS
  doc.setFillColor(rose[0], rose[1], rose[2]);
  doc.rect(margin, currentY, 3, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(`3. DÉTAIL DES DÉPENSES & DÉCAISSEMENTS VALIDÉS (${data.depenses.length} opérations)`, margin + 5, currentY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Total décaissé : ${data.totalDepenses.toLocaleString('fr-FR')} FCFA`, pageWidth - margin - 55, currentY + 4);

  currentY += 7;

  // Table Dépenses Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('DATE', margin + 2, currentY + 3.8);
  doc.text('CATÉGORIE', margin + 25, currentY + 3.8);
  doc.text('DESCRIPTION / MOTIF DE DÉPENSE', margin + 58, currentY + 3.8);
  doc.text('COMPTE DÉBITÉ', margin + 120, currentY + 3.8);
  doc.text('VALIDATEUR', margin + 148, currentY + 3.8);
  doc.text('MONTANT', margin + 166, currentY + 3.8);

  currentY += 5.5;

  if (data.depenses.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Aucune dépense validée enregistrée sur ce mois.', margin + 4, currentY + 4);
    currentY += 7;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    data.depenses.forEach((d, idx) => {
      const rowY = currentY + idx * 5.2;
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, rowY - 0.8, contentWidth, 5.2, 'F');
      }
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(d.dateDepense, margin + 2, rowY + 2.8);
      doc.text(d.categorie.replace('_', ' ').substring(0, 16), margin + 25, rowY + 2.8);
      doc.text(d.description.substring(0, 38), margin + 58, rowY + 2.8);
      doc.text(d.compteNom.substring(0, 18), margin + 120, rowY + 2.8);
      doc.text(d.valideParNom || 'Trésorier', margin + 148, rowY + 2.8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(rose[0], rose[1], rose[2]);
      doc.text(`${d.montantFCFA.toLocaleString('fr-FR')} F`, margin + 166, rowY + 2.8);
      doc.setFont('helvetica', 'normal');
    });
    currentY += data.depenses.length * 5.2 + 4;
  }

  // 6. ANALYSE DES DÉPENSES PAR POSTE (Catégories)
  currentY += 2;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(margin, currentY, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('VENTILATION DES CHARGES DU MOIS PAR POSTE', margin + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  let catX = margin + 4;
  const categoriesEntries = Object.entries(data.depensesParCategorie);
  if (categoriesEntries.length === 0) {
    doc.text('Aucune charge ventilée pour cette période.', margin + 4, currentY + 11);
  } else {
    categoriesEntries.slice(0, 4).forEach(([cat, amount]) => {
      const pct = data.totalDepenses > 0 ? Math.round((amount / data.totalDepenses) * 100) : 0;
      doc.text(`• ${cat.replace('_', ' ')} :`, catX, currentY + 11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${amount.toLocaleString('fr-FR')} FCFA (${pct}%)`, catX + 30, currentY + 11);
      doc.setFont('helvetica', 'normal');
      catX += 45;
    });
  }

  // 7. SECTION 4: BILAN DES COMPTES DE TRÉSORERIE & RAPPROCHEMENT
  currentY += 24;
  doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.rect(margin, currentY, 3, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('4. RAPPROCHEMENT BANCAIRE & DISPONIBILITÉS EN CAISSE', margin + 5, currentY + 4);

  currentY += 7;
  const halfColW = (contentWidth - 6) / 2;

  // Box Left: Soldes disponibles
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(margin, currentY, halfColW, 30, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('SOLDES RÉELS DES COMPTES DE TRÉSORERIE', margin + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  let cptY = currentY + 11;
  data.comptes.forEach((c) => {
    doc.text(`• ${c.nom} :`, margin + 4, cptY);
    doc.setFont('helvetica', 'bold');
    doc.text(`${c.soldeActuelFCFA.toLocaleString('fr-FR')} FCFA`, margin + halfColW - 28, cptY);
    doc.setFont('helvetica', 'normal');
    cptY += 5;
  });

  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.line(margin + 4, cptY - 1, margin + halfColW - 4, cptY - 1);
  doc.setFont('helvetica', 'bold');
  doc.text('SOLDE GLOBAL DISPONIBLE :', margin + 4, cptY + 3.5);
  doc.setTextColor(emerald[0], emerald[1], emerald[2]);
  doc.text(`${data.totalSoldeTresorerie.toLocaleString('fr-FR')} FCFA`, margin + halfColW - 32, cptY + 3.5);

  // Box Right: Indicateurs de performance & Pertes
  const rightColX = margin + halfColW + 6;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(rightColX, currentY, halfColW, 30, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('RATIOS FINANCIERS DU SERVICE D EAU', rightColX + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('• Taux de Recouvrement des factures :', rightColX + 4, currentY + 11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.tauxRecouvrement}%`, rightColX + halfColW - 15, currentY + 11);
  doc.setFont('helvetica', 'normal');

  doc.text('• Volume total pompé aux forages :', rightColX + 4, currentY + 16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.totalVolumeProduitM3.toLocaleString('fr-FR')} m³`, rightColX + halfColW - 22, currentY + 16);
  doc.setFont('helvetica', 'normal');

  doc.text('• Volume d eau facturé aux abonnés :', rightColX + 4, currentY + 21);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.totalFactureM3.toLocaleString('fr-FR')} m³`, rightColX + halfColW - 22, currentY + 21);
  doc.setFont('helvetica', 'normal');

  doc.text('• Créances impayées à recouvrer :', rightColX + 4, currentY + 26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(rose[0], rose[1], rose[2]);
  doc.text(`${data.totalImpayesFactures.toLocaleString('fr-FR')} FCFA`, rightColX + halfColW - 28, currentY + 26);

  // 8. VISAS OFFICIELS ET SIGNATURES DES RESPONSABLES
  currentY += 36;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(margin, currentY, contentWidth, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('APPROBATIONS, VISAS COMPTABLES ET ATTESTATION DE CONFORMITÉ', margin + 4, currentY + 5);

  const signW = (contentWidth - 12) / 3;

  // Signature 1: Trésorier
  const s1X = margin + 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('1. Le Trésorier Général', s1X, currentY + 11);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(s1X, currentY + 13, signW, 14, 1, 1, 'S');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(5.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('[ Signature & Date ]', s1X + signW / 2 - 12, currentY + 21);

  // Signature 2: Commissaire aux comptes
  const s2X = s1X + signW + 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('2. Comité de Surveillance', s2X, currentY + 11);
  doc.roundedRect(s2X, currentY + 13, signW, 14, 1, 1, 'S');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(5.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('[ Visa de Contrôle ]', s2X + signW / 2 - 12, currentY + 21);

  // Signature 3: Président ASUFOR
  const s3X = s2X + signW + 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("3. Le Président de l'ASUFOR", s3X, currentY + 11);
  doc.roundedRect(s3X, currentY + 13, signW, 14, 1, 1, 'S');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(5.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('[ Cachet & Approbation ]', s3X + signW / 2 - 14, currentY + 21);

  // Footer Page 2
  const footer2Y = pageHeight - 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    'FACTUREAU SaaS V3.0 - Plateforme de gestion des forages et services d eau potable | Rapport certifié conforme aux normes OHADA',
    margin,
    footer2Y
  );
  doc.text('Page 2 / 2', pageWidth - margin - 15, footer2Y);

  return doc;
}

export function exportMonthlyFinancialReportPdf(data: MonthlyFinancialReportPayload): void {
  const doc = generateMonthlyFinancialReportPdf(data);
  const fileName = `Rapport_Financier_Mensuel_FACTUREAU_${data.mois}.pdf`;
  doc.save(fileName);
}

/**
 * Exporte l'intégralité du Bilan Financier Mensuel au format CSV pour tableur
 */
export function exportMonthlyFinancialReportCsv(data: MonthlyFinancialReportPayload): void {
  const BOM = '\uFEFF';
  const sep = ';';
  const escape = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const metaRows = [
    [escape('RAPPORT FINANCIER & ÉTATS DE TRÉSORERIE'), escape(data.organisationNom)],
    [escape('Mois d\'exercice'), escape(data.formattedMonthFr), escape(data.mois)],
    [escape('Région / Département'), escape(`${data.region} / ${data.departement}`)],
    [escape('Total Facturé TTC (FCFA)'), escape(data.totalFactureTTC)],
    [escape('Volume Total Facturé (m³)'), escape(data.totalFactureM3)],
    [escape('Total Recettes Encaissées (FCFA)'), escape(data.totalRecettes)],
    [escape('Taux de Recouvrement'), escape(`${data.tauxRecouvrement}%`)],
    [escape('Total Dépenses Validées (FCFA)'), escape(data.totalDepenses)],
    [escape('Marge Nette d\'Exploitation (FCFA)'), escape(data.margeNetteExploitation)],
    [escape('Créances Impayées (FCFA)'), escape(data.totalImpayesFactures)],
    [escape('Solde Trésorerie Global (FCFA)'), escape(data.totalSoldeTresorerie)],
    [],
    [escape('--- RÉPARTITION DES PAIEMENTS PAR CANAL ---')],
    [escape('Wave Mobile Money'), escape(data.paiementsParMode.wave)],
    [escape('Orange Money'), escape(data.paiementsParMode.orangeMoney)],
    [escape('Espèces Caisse Forage'), escape(data.paiementsParMode.especes)],
    [escape('Autres Règlements'), escape(data.paiementsParMode.autres)],
    [],
    [escape('--- DÉTAIL DES PAIEMENTS ENCAISSÉS ---')],
    [escape('N° Reçu'), escape('Date'), escape('Abonné'), escape('N° Facture'), escape('Mode'), escape('Montant (FCFA)')],
    ...data.paiements.map((p) => [
      escape(p.recuNumero),
      escape(p.datePaiement),
      escape(p.abonneNom),
      escape(p.numeroFacture),
      escape(p.modePaiement),
      escape(p.montantFCFA),
    ]),
    [],
    [escape('--- DÉTAIL DES DÉPENSES DÉCAISSÉES ---')],
    [escape('Date'), escape('Catégorie'), escape('Description / Motif'), escape('Compte'), escape('Validé par'), escape('Montant (FCFA)')],
    ...data.depenses.map((d) => [
      escape(d.dateDepense),
      escape(d.categorie),
      escape(d.description),
      escape(d.compteNom),
      escape(d.valideParNom || 'Trésorier'),
      escape(d.montantFCFA),
    ]),
  ];

  const csvContent = BOM + metaRows.map((r) => r.join(sep)).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Bilan_Financier_${data.mois}_FACTUREAU.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

