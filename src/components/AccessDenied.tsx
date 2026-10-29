import React from 'react';
import { Usuario } from '../types/erp';
import { ShieldAlert, Lock, ArrowLeft, UserCheck } from 'lucide-react';

interface AccessDeniedProps {
  currentUser: Usuario;
  moduleName: string;
  onGoBack: () => void;
  onOpenLogin: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  currentUser,
  moduleName,
  onGoBack,
  onOpenLogin,
}) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 mb-5 shadow-lg shadow-rose-950/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-extrabold text-white tracking-tight">Acceso Restringido por Rol</h2>
        <p className="text-sm text-slate-300 mt-2 font-medium">
          El módulo <span className="text-emerald-400 font-bold">"{moduleName}"</span> no está habilitado para su rol actual:
        </p>

        <div className="my-5 p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 text-xs inline-flex items-center space-x-3">
          <span className="font-semibold text-slate-400">Usuario actual:</span>
          <span className="font-bold text-white">@{currentUser.username}</span>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-extrabold uppercase">
            Rol: {currentUser.rol_nombre}
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          Para acceder a las funciones económicas, contables o administrativas, debe iniciar sesión con un usuario que posea el rol de <strong>Administrador</strong> o <strong>Responsable de Unidad</strong>.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onGoBack}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Dashboard</span>
          </button>

          <button
            onClick={onOpenLogin}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-950/40 cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Cambiar de Rol / Usuario</span>
          </button>
        </div>
      </div>
    </div>
  );
};
