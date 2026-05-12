"use client";

import { useTemperatureData } from "@/hooks/useTemperatureData";
import {
  Bell,
  ShieldAlert,
  CheckCircle2,
  Clock,
  MapPin,
  Filter,
} from "lucide-react";

export default function AlertsPage() {
  const { alerts, acknowledgeAlert } = useTemperatureData();

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">
            Centre d'Alertes
          </h2>
          <p className="text-gray-500 font-medium">
            Surveillance des incidents et seuils critiques
          </p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 font-bold px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4" />
          Filtrer
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-2">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Alertes Récentes
          </h3>

          {alerts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
              <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Tout est sous contrôle
              </h4>
              <p className="text-gray-500">
                Aucune alerte critique détectée au cours des dernières 24
                heures.
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white p-6 rounded-3xl border transition-all ${alert.acknowledged ? "border-gray-100 opacity-60" : "border-rose-100 shadow-rose-50"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <div
                      className={`p-3 rounded-2xl ${alert.acknowledged ? "bg-gray-100" : "bg-rose-50"}`}
                    >
                      <ShieldAlert
                        className={`w-6 h-6 ${alert.acknowledged ? "text-gray-400" : "text-rose-600"}`}
                      />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">
                        Température Critique : {alert.temperature}°C
                      </h4>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-400 font-medium">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {alert.district}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="bg-rose-600 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-rose-700 transition-colors shadow-rose-100"
                    >
                      Acquitter
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <div className="bg-gray-900 rounded-3xl p-8 text-white">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-400" />
              Notifications Push
            </h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Recevez des alertes directement sur votre mobile en cas de
              dépassement des seuils critiques.
            </p>
            <button className="w-full bg-white text-gray-900 font-black py-3 rounded-2xl hover:bg-gray-100 transition-colors">
              Activer
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Statistiques d'incidents
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500">
                  Total Mois
                </span>
                <span className="text-lg font-black text-gray-900">12</span>
              </div>
              <div className="w-full h-2 bg-gray-50 rounded-full">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: "65%" }}
                />
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                35% de moins que le mois dernier
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
