import React from 'react';
import { X, Printer, QrCode, Droplets, CheckCircle2, ShieldCheck, MapPin, Phone } from 'lucide-react';
import { Abonne, Forage, Compteur } from '../types';
import { store } from '../services/store';

interface CarteAbonneModalProps {
  abonne: Abonne | null;
  onClose: () => void;
}

export const CarteAbonneModal: React.FC<CarteAbonneModalProps> = ({ abonne, onClose }) => {
  if (!abonne) return null;

  const currentOrg = store.getCurrentOrganisation();
  const forages = store.getForages();
  const compteurs = store.getCompteurs();

  const forage = forages.find((f) => f.id === abonne.forageId);
  const compteur = compteurs.find((c) => c.id === abonne.compteurId);

  const qrData = `FACTUREAU|ABONNE|${abonne.codeAbonne}|${abonne.prenom} ${abonne.nom}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Header bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h3 className="font-extrabold text-[#082F49] dark:text-cyan-300 text-sm">
              Carte Officielle d'Abonné (Badge QR)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6">
          <div className="relative rounded-2xl p-5 bg-gradient-to-br from-[#082F49] via-[#0369A1] to-[#0284C7] text-white shadow-xl overflow-hidden border border-cyan-400/30">
            {/* Watermark background decoration */}
            <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-cyan-400/10 blur-xl pointer-events-none" />
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 text-white/5 pointer-events-none">
              <Droplets className="w-36 h-36" />
            </div>

            {/* Top brand header */}
            <div className="flex items-start justify-between relative z-10 pb-3 border-b border-white/15">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-cyan-200 font-bold flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-cyan-300" />
                  RÉSEAU D'EAU POTABLE
                </div>
                <div className="font-black text-base text-white tracking-wide mt-0.5">
                  {currentOrg?.nom || 'FACTUREAU'}
                </div>
                <div className="text-[10px] text-cyan-100/80">
                  {forage?.nom || 'Forage Communautaire'}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-cyan-500/30 border border-cyan-300/40 font-mono font-bold text-cyan-100">
                  CARTE USAGER
                </span>
                <div className="font-mono font-extrabold text-sm text-cyan-200 mt-1">
                  {abonne.codeAbonne}
                </div>
              </div>
            </div>

            {/* Middle info */}
            <div className="my-4 flex items-center justify-between gap-4 relative z-10">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div>
                  <span className="text-[9px] text-cyan-200 uppercase font-semibold block">
                    Titulaire du contrat
                  </span>
                  <div className="font-extrabold text-white text-base leading-tight truncate">
                    {abonne.prenom} {abonne.nom}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-[9px] text-cyan-200 block">Téléphone</span>
                    <span className="font-mono font-medium text-white/95">{abonne.telephone}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-cyan-200 block">Quartier</span>
                    <span className="truncate block text-white/95">{abonne.quartier}</span>
                  </div>
                </div>

                <div className="text-[10px] text-cyan-100/90 pt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span>Compteur : {compteur ? compteur.numeroSerie : 'Branchement Direct'}</span>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="w-24 h-24 bg-white p-1.5 rounded-xl border-2 border-cyan-300/60 shadow-lg shrink-0 flex flex-col items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                    qrData
                  )}`}
                  alt="QR Code Carte Abonné"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Footer card note */}
            <div className="pt-2.5 border-t border-white/15 flex items-center justify-between text-[9px] text-cyan-100/80 relative z-10 font-mono">
              <span>SCAN RAPIDE AU GUICHET & MOBILE</span>
              <span>STATUT: {abonne.statut}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-4">
            Ce QR code est lisible par la caméra du trésorier pour encaisser instantanément les factures de l'abonné.
          </p>
        </div>

        {/* Modal Buttons */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs cursor-pointer"
          >
            Fermer
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-[#082F49] hover:bg-sky-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Imprimer la Carte Plastifiée</span>
          </button>
        </div>
      </div>
    </div>
  );
};
