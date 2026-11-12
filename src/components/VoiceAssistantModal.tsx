import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  Gauge,
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  voiceCommandService,
  ParsedVoiceCommand,
} from '../services/voiceCommandService';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<ParsedVoiceCommand | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [speechFeedback, setSpeechFeedback] = useState(
    voiceCommandService.isSpeechFeedbackEnabled()
  );
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    return voiceCommandService.subscribe((state) => {
      setIsListening(state.isListening);
      setTranscript(state.transcript);
      setLastCommand(state.lastCommand);
      setError(state.error);
      setIsSupported(state.isSupported);
    });
  }, []);

  // Start listening automatically when modal opens if supported
  useEffect(() => {
    if (isOpen && isSupported) {
      voiceCommandService.startListening();
    } else {
      voiceCommandService.stopListening();
    }
  }, [isOpen, isSupported]);

  if (!isOpen) return null;

  const handleToggleListening = () => {
    if (isListening) {
      voiceCommandService.stopListening();
    } else {
      voiceCommandService.startListening();
    }
  };

  const handleToggleSpeechFeedback = () => {
    const next = !speechFeedback;
    setSpeechFeedback(next);
    voiceCommandService.setSpeechFeedbackEnabled(next);
  };

  const handleManualCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    voiceCommandService.processCommand(manualInput);
    setManualInput('');
  };

  const handleRunExample = (commandText: string) => {
    setTranscript(commandText);
    voiceCommandService.processCommand(commandText);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-700 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Mic className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Assistant Vocal FACTUREAU</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Web Speech API
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Navigation vocale & dictée assistée de relevés de compteurs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleSpeechFeedback}
              className={`p-2 rounded-xl transition cursor-pointer ${
                speechFeedback
                  ? 'text-cyan-400 bg-sky-950/80 border border-sky-800'
                  : 'text-slate-500 hover:bg-slate-800'
              }`}
              title={speechFeedback ? 'Réponse vocale activée' : 'Réponse vocale coupée'}
            >
              {speechFeedback ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive Microphone & Waveform Area */}
        <div className="p-6 text-center bg-gradient-to-b from-slate-950/40 to-slate-900/40 border-b border-slate-800/80 relative flex flex-col items-center">
          {/* Animated Glowing Ring & Button */}
          <div className="relative my-3">
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping" />
                <div className="absolute -inset-4 rounded-full bg-cyan-500/10 animate-pulse" />
              </>
            )}

            <button
              onClick={handleToggleListening}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-xl ${
                isListening
                  ? 'bg-gradient-to-tr from-rose-600 to-cyan-500 text-white scale-105 shadow-cyan-500/30 ring-4 ring-cyan-400/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title={isListening ? 'Cliquez pour arrêter l’écoute' : 'Cliquez pour parler'}
            >
              {isListening ? (
                <Mic className="w-8 h-8 animate-pulse text-white" />
              ) : (
                <MicOff className="w-8 h-8 text-slate-400" />
              )}
            </button>
          </div>

          {/* Status Label */}
          <div className="text-xs font-bold mt-2">
            {isListening ? (
              <span className="text-cyan-400 flex items-center gap-1.5 justify-center">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>À l'écoute... Dites votre commande ou dictée en français</span>
              </span>
            ) : (
              <span className="text-slate-400">
                Microphone inactif. Cliquez sur le micro ou sélectionnez une commande ci-dessous.
              </span>
            )}
          </div>

          {/* Transcript Display Box */}
          <div className="mt-4 w-full bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-left min-h-[72px] flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
              Transcription en direct :
            </span>
            <div className="text-sm font-semibold text-slate-100 font-mono">
              {transcript ? (
                <span className="text-cyan-300">« {transcript} »</span>
              ) : (
                <span className="text-slate-500 italic">
                  Parlez maintenant (ex : "Aller aux factures", "Relevé Moussa Diouf index 450")...
                </span>
              )}
            </div>
          </div>

          {/* Feedback or Error Message */}
          {error && (
            <div className="mt-3 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 text-left w-full">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Recognized Command Execution Card */}
          {lastCommand && (
            <div
              className={`mt-4 w-full p-3.5 rounded-2xl border text-left text-xs transition-all ${
                lastCommand.type === 'INCONNU'
                  ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                  : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold flex items-center gap-1.5">
                  {lastCommand.type === 'INCONNU' ? (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>{lastCommand.type.replace('_', ' ')}</span>
                </span>
                {lastCommand.moduleLabel && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                    {lastCommand.moduleLabel}
                  </span>
                )}
              </div>
              <p className="mt-1 text-slate-200 font-medium leading-relaxed">
                {lastCommand.message}
              </p>
            </div>
          )}
        </div>

        {/* Cheat Sheet & Examples */}
        <div className="p-4 sm:p-5 space-y-4 max-h-60 overflow-y-auto">
          {/* Section: Saisie de relevé de compteur via dictée vocale */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 mb-2">
              <Gauge className="w-4 h-4" />
              <span>Dictée vocale de Relevé de Compteur :</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleRunExample('Relevé Moussa Diouf index 450')}
                className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-left transition flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <div className="font-bold text-white group-hover:text-cyan-300">
                    « Relevé Moussa Diouf index 450 »
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Ouvre & pré-remplit l'index pour Moussa Diouf
                  </div>
                </div>
                <Play className="w-3.5 h-3.5 text-cyan-400 shrink-0 opacity-60 group-hover:opacity-100" />
              </button>

              <button
                onClick={() => handleRunExample('Relevé ABN-001 index 125')}
                className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-left transition flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <div className="font-bold text-white group-hover:text-cyan-300">
                    « Relevé ABN-001 index 125 »
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Dictée par code d'abonné direct
                  </div>
                </div>
                <Play className="w-3.5 h-3.5 text-cyan-400 shrink-0 opacity-60 group-hover:opacity-100" />
              </button>
            </div>
          </div>

          {/* Section: Navigation vocale entre les modules */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 mb-2">
              <Compass className="w-4 h-4" />
              <span>Navigation Vocale entre les Modules :</span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                { cmd: 'Aller aux factures', label: 'Factures' },
                { cmd: 'Afficher les paiements', label: 'Paiements & Wave' },
                { cmd: 'Tableau de bord', label: 'Tableau de bord' },
                { cmd: 'Voir les abonnés', label: 'Abonnés' },
                { cmd: 'Compteurs et relevés', label: 'Compteurs' },
                { cmd: 'Caisse et dépenses', label: 'Caisse' },
                { cmd: 'Production et stocks', label: 'Production' },
                { cmd: 'Pannes et maintenance', label: 'Maintenance' },
                { cmd: 'Impayés et coupures', label: 'Coupures' },
                { cmd: 'Logs d’audit', label: 'Journal Audit' },
              ].map((item) => (
                <button
                  key={item.cmd}
                  onClick={() => handleRunExample(item.cmd)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-sky-900/60 border border-slate-700 hover:border-sky-600 text-[11px] font-semibold text-slate-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>{item.cmd}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Fallback Manual Text Input for non-microphone testing */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <form onSubmit={handleManualCommandSubmit} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ou tapez une commande vocale (ex : Relevé Moussa Diouf index 450)..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <span>Exécuter</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
