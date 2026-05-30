"use client";

import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Database,
  Droplets,
  Gauge,
  Radio,
  Save,
  Server,
  SlidersHorizontal,
  Thermometer,
} from "lucide-react";
import { BACKEND_URL, SPARK_THRESHOLDS } from "@/lib/constants";

const serviceSettings = [
  {
    icon: Server,
    title: "Backend API",
    status: "http://localhost:4000",
    detail: BACKEND_URL,
  },
  {
    icon: Radio,
    title: "Socket.IO",
    status: "Temps réel",
    detail: "environment, water, traffic, spark",
  },
  {
    icon: Database,
    title: "Kafka / Spark",
    status: "Streaming",
    detail: "smartcity.spark.alerts et agrégations",
  },
];

const thresholdSettings = [
  {
    icon: Thermometer,
    label: "Température critique",
    value: SPARK_THRESHOLDS.criticalTemperature,
    unit: "°C",
  },
  {
    icon: Gauge,
    label: "AQI critique",
    value: SPARK_THRESHOLDS.criticalAqi,
    unit: "AQI",
  },
  {
    icon: Droplets,
    label: "Débit minimum",
    value: SPARK_THRESHOLDS.criticalLowFlow,
    unit: "L/min",
  },
  {
    icon: Gauge,
    label: "Congestion critique",
    value: SPARK_THRESHOLDS.criticalCongestion,
    unit: "ratio",
  },
];

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl p-6 lg:p-8">
      <header className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Réglages</h2>
          <p className="mt-2 max-w-2xl text-sm font-medium text-gray-500">
            Configuration opérationnelle des services, seuils Spark et préférences d&apos;alerte.
          </p>
        </div>
        <button className="flex w-fit items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-black text-gray-600">
          <Save className="h-4 w-4" />
          Lecture seule
        </button>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {serviceSettings.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-2xl border border-gray-100 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase text-emerald-700">
                  {item.status}
                </span>
              </div>
              <h3 className="text-lg font-black text-gray-900">{item.title}</h3>
              <p className="mt-2 break-words text-sm font-medium text-gray-500">
                {item.detail}
              </p>
            </div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-gray-100 p-5">
          <div className="mb-5 flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-black text-gray-900">Seuils Spark</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {thresholdSettings.map((item) => {
              const Icon = item.icon;
              return (
                <label key={item.label} className="rounded-2xl border border-gray-100 p-4">
                  <span className="mb-3 flex items-center gap-2 text-sm font-black text-gray-900">
                    <Icon className="h-4 w-4 text-emerald-600" />
                    {item.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={item.value}
                      className="h-11 min-w-0 flex-1 rounded-xl border border-gray-200 px-3 text-sm font-bold"
                    />
                    <span className="w-16 text-sm font-bold text-gray-500">{item.unit}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-3xl border border-gray-100 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-gray-900">
              <Bell className="h-5 w-5 text-green-500" />
              Alertes
            </h3>
            <div className="space-y-3">
              {[
                "Afficher les alertes critiques",
                "Conserver les alertes acquittées",
                "Signaler les données obsolètes",
              ].map((label) => (
                <label
                  key={label}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 px-4 py-3"
                >
                  <span className="text-sm font-bold text-gray-700">{label}</span>
                  <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-gray-300" />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-green-100 bg-green-50 p-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-black uppercase text-green-700">
              <AlertTriangle className="h-4 w-4" />
              Variables d&apos;environnement
            </h3>
            <p className="text-sm font-medium leading-relaxed text-green-700">
              Les valeurs sensibles restent hors du client. Modifiez Kafka, MongoDB et Spark via les fichiers d&apos;environnement locaux.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-black uppercase text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              État attendu
            </h3>
            <p className="text-sm font-medium leading-relaxed text-emerald-700">
              Kafka, Node-RED, backend, frontend puis Spark doivent être lancés dans cet ordre.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
