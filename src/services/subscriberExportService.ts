import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Abonne, Compteur, Forage, Organisation } from '../types';
import { store } from './store';
import { formatFCFA, formatNumberDot } from '../utils/formatters';

export interface SubscriberExportOptions {
  organisation?: Organisation | null;
  forages?: Forage[];
  compteurs?: Compteur[];
  selectedForageNom?: string;
  selectedStatut?: string;
  selectedCategorie?: string;
  destinataire?: string; // 'OFOR' | 'DGPRE' | 'MAIRIE' | 'BAILLEURS' | 'INTERNE'
  dateGeneration?: string;
}

/**
 * Exporte la liste / registre des abonnés au format PDF officiel certifié
 * avec pagination automatique multi-pages, récapitulatif institutionnel et visas.
 */
export function exportAbonnesPdf(abonnes: Abonne[], options?: SubscriberExportOptions): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const currentOrg = options?.organisation || store.getCurrentOrganisation();
  const allForages = options?.forages || store.getForages();
  const allCompteurs = options?.compteurs || store.getCompteurs();
  const dateStr = options?.dateGeneration || new Date().toLocaleDateString('fr-FR');
  const orgNom = currentOrg?.nom || 'ASUFOR de Touba Toul';
  const region = currentOrg?.region || 'Thiès';
  const departement = currentOrg?.departement || 'Tivaouane';
  const destinataire = options?.destinataire || 'Autorités Sectorielles & Partenaires (OFOR / DGPRE / Commune)';

  // Calculate aggregates
  const totalAbonnes = abonnes.length;
  const actifsCount = abonnes.filter((a) => a.statut === 'ACTIF').length;
  const suspendusCount = abonnes.filter((a) => a.statut === 'SUSPENDU').length;
  const cloturesCount = abonnes.filter((a) => a.statut === 'CLOTURE').length;
  const totalDette = abonnes.reduce((sum, a) => sum + (a.soldeDetteFCFA || 0), 0);
  const totalAvecCompteur = abonnes.filter((a) => a.compteurId).length;
  const tauxActif = totalAbonnes > 0 ? Math.round((actifsCount / totalAbonnes) * 100) : 0;

  // Header band
  doc.setFillColor(8, 47, 73); // #082F49 Navy
  doc.rect(margin, margin, contentWidth, 24, 'F');

  // Decorative top accent strip (Senegal flag hint or cyan)
  doc.setFillColor(14, 165, 233); // Cyan
  doc.rect(margin, margin, contentWidth, 2, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RÉPUBLIQUE DU SÉNÉGAL • MINISTÈRE DE L\'HYDRAULIQUE ET DE L\'ASSAINISSEMENT', margin + 6, margin + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `REGISTRE OFFICIEL DES ABONNÉS & BRANCHEMENTS PARTICULIERS — ${orgNom.toUpperCase()}`,
    margin + 6,
    margin + 15
  );

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Département de ${departement} (${region}) • Périmètre : ${options?.selectedForageNom || 'Ensemble des forages'} • Transmission : ${destinataire}`,
    margin + 6,
    margin + 20
  );

  // Right-side meta in header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`Document Certifié FACTUREAU`, pageWidth - margin - 6, margin + 8, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Date d'arrêté : ${dateStr}`, pageWidth - margin - 6, margin + 14, { align: 'right' });
  doc.text(`Total : ${totalAbonnes} usagers répertoriés`, pageWidth - margin - 6, margin + 20, { align: 'right' });

  // KPI Summary Bar (4 mini boxes)
  const kpiY = margin + 28;
  const kpiH = 15;
  const kpiW = (contentWidth - 9) / 4;

  const kpis = [
    {
      label: 'TOTAL ABONNÉS',
      val: `${totalAbonnes} Usagers`,
      sub: `${actifsCount} actifs (${tauxActif}%) • ${suspendusCount} suspendus`,
      bg: [241, 245, 249],
      txt: [8, 47, 73],
    },
    {
      label: 'BRANCHEMENTS COMPTÉS',
      val: `${totalAvecCompteur} / ${totalAbonnes}`,
      sub: `${totalAbonnes - totalAvecCompteur} sans compteur direct`,
      bg: [240, 249, 255],
      txt: [3, 105, 161],
    },
    {
      label: 'CRÉANCES IMPAYÉES (DETTE)',
      val: formatFCFA(totalDette),
      sub: totalDette > 0 ? 'Créances usagers en cours de recouvrement' : 'Aucun impayé constaté',
      bg: [255, 241, 242],
      txt: [225, 29, 72],
    },
    {
      label: 'CADRE DE CONTRÔLE',
      val: 'Normes DGPRE / OFOR',
      sub: 'Conforme au code de l\'eau du Sénégal',
      bg: [240, 253, 244],
      txt: [5, 150, 105],
    },
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (kpiW + 3);
    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, kpiY, kpiW, kpiH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3.5, kpiY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(kpi.txt[0], kpi.txt[1], kpi.txt[2]);
    doc.text(kpi.val, x + 3.5, kpiY + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, x + 3.5, kpiY + 13.2);
  });

  // Prepare table data
  const tableData = abonnes.map((a, index) => {
    const forage = allForages.find((f) => f.id === a.forageId);
    const compteur = allCompteurs.find((c) => c.id === a.compteurId);
    const detteStr = formatNumberDot(a.soldeDetteFCFA || 0);

    return [
      String(index + 1).padStart(2, '0'),
      a.codeAbonne,
      `${a.nom.toUpperCase()} ${a.prenom}`,
      a.telephone,
      a.quartier || 'Centre',
      forage ? forage.nom : 'Forage principal',
      compteur ? compteur.numeroSerie : 'Non assigné',
      a.categorie || 'DOMESTIQUE',
      `${detteStr} F`,
      a.statut || 'ACTIF',
    ];
  });

  // Generate table with autoTable
  autoTable(doc, {
    startY: kpiY + kpiH + 4,
    margin: { left: margin, right: margin, bottom: 28 },
    head: [
      [
        'N°',
        'Code',
        'Nom & Prénom de l\'Abonné',
        'Téléphone',
        'Quartier / Secteur',
        'Forage Source',
        'N° Compteur',
        'Catégorie',
        'Dette (FCFA)',
        'Statut',
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [8, 47, 73],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2,
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 18, fontStyle: 'bold', halign: 'left' },
      2: { cellWidth: 50, fontStyle: 'bold' },
      3: { cellWidth: 26, font: 'courier' },
      4: { cellWidth: 32 },
      5: { cellWidth: 36 },
      6: { cellWidth: 26, font: 'courier' },
      7: { cellWidth: 24 },
      8: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      9: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Color debt
      if (data.section === 'body' && data.column.index === 8) {
        const row = abonnes[data.row.index];
        if (row && row.soldeDetteFCFA > 0) {
          data.cell.styles.textColor = [225, 29, 72];
        } else {
          data.cell.styles.textColor = [5, 150, 105];
        }
      }
      // Color status
      if (data.section === 'body' && data.column.index === 9) {
        const row = abonnes[data.row.index];
        if (row) {
          if (row.statut === 'ACTIF') {
            data.cell.styles.textColor = [5, 150, 105];
          } else if (row.statut === 'SUSPENDU') {
            data.cell.styles.textColor = [217, 119, 6];
          } else {
            data.cell.styles.textColor = [225, 29, 72];
          }
        }
      }
    },
  });

  // Calculate final page and add signatures
  const finalDoc: any = doc;
  const pageCount = finalDoc.internal.getNumberOfPages();

  // Draw footer & signature blocks on the last page or append a page if not enough space
  let lastPageY = (doc as any).lastAutoTable?.finalY || 160;

  if (lastPageY > pageHeight - 38) {
    doc.addPage();
    lastPageY = margin + 10;
  }

  // Visas & Signatures container
  const sigY = Math.max(lastPageY + 6, pageHeight - 34);
  const sigBoxW = (contentWidth - 12) / 4;
  const sigBoxH = 24;

  const signatures = [
    { title: 'Le Responsable du Fichier', note: 'Certification des branchements' },
    { title: 'Le Trésorier Général', note: 'Certifie le montant des créances' },
    { title: 'Le Président de l\'ASUFOR', note: 'Approbation finale du registre' },
    { title: 'Visa de l\'Autorité (OFOR/Mairie)', note: 'Cachet & Visa de contrôle' },
  ];

  signatures.forEach((sig, idx) => {
    const x = margin + idx * (sigBoxW + 4);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(x, sigY, sigBoxW, sigBoxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(8, 47, 73);
    doc.text(sig.title, x + 3.5, sigY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(sig.note, x + 3.5, sigY + 9);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text('Date & Signature :', x + 3.5, sigY + sigBoxH - 3);
  });

  // Add Page Numbers on all pages
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Registre Officiel des Abonnés • ${orgNom} • Extraction certifiée FACTUREAU • Page ${i} sur ${pageCount}`,
      margin,
      pageHeight - 4
    );
    doc.text(`Fait à ${region}, le ${dateStr}`, pageWidth - margin, pageHeight - 4, { align: 'right' });
  }

  // Save the document
  const cleanOrg = orgNom.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanDate = dateStr.replace(/[^a-zA-Z0-9]/g, '-');
  doc.save(`Registre_Abonnes_${cleanOrg}_${cleanDate}.pdf`);
}

/**
 * Exporte la liste des abonnés au format CSV compatible avec Microsoft Excel (UTF-8 avec BOM)
 */
export function exportAbonnesCsv(abonnes: Abonne[], options?: SubscriberExportOptions): void {
  const allForages = options?.forages || store.getForages();
  const allCompteurs = options?.compteurs || store.getCompteurs();

  // Excel UTF-8 BOM
  const BOM = '\uFEFF';

  // Semicolon separator for French Excel locales
  const sep = ';';

  const headers = [
    'Code Abonné',
    'Prénom',
    'Nom',
    'Téléphone',
    'Quartier',
    'Adresse',
    'Forage de Rattachement',
    'N° Série Compteur',
    'Catégorie Tarifaire',
    'Statut',
    'Solde Dette (FCFA)',
    'Date Inscription',
  ];

  const escapeField = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = abonnes.map((a) => {
    const forage = allForages.find((f) => f.id === a.forageId);
    const compteur = allCompteurs.find((c) => c.id === a.compteurId);

    return [
      escapeField(a.codeAbonne),
      escapeField(a.prenom),
      escapeField(a.nom),
      escapeField(a.telephone),
      escapeField(a.quartier),
      escapeField(a.adresse || ''),
      escapeField(forage ? `${forage.nom} (${forage.code})` : 'Forage principal'),
      escapeField(compteur ? compteur.numeroSerie : 'Non assigné'),
      escapeField(a.categorie),
      escapeField(a.statut),
      escapeField(a.soldeDetteFCFA || 0),
      escapeField(a.dateInscription || ''),
    ].join(sep);
  });

  const csvContent = BOM + [headers.map(escapeField).join(sep), ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `Registre_Abonnes_FACTUREAU_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
