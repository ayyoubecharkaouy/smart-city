"use client";

import SparkInsights from "@/components/SparkInsights";
import { Zap, Cpu, Server, Database } from "lucide-react";
import Image from "next/image";

export default function SparkDataPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Image
            src="/images/logos/spark.png"
            alt="Spark"
            width={200}
            height={200}
          />
          <div>
            <h2 className="text-3xl font-black text-gray-900 leading-tight">
              Moteur de Calcul Spark
            </h2>
            <p className="text-gray-500 font-medium">
              Analyse en temps réel via fenêtres coulissantes
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Info */}
        <div className="space-y-2">
          <div className="bg-white p-6 rounded-3xl border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Architecture
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-600">Moteur</span>
                <span className="text-sm font-black text-orange-600">
                  Apache Spark 3.5
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-600">
                  Pipeline
                </span>
                <span className="text-sm font-black text-blue-600">
                  Structured Streaming
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-600">Fenêtre</span>
                <span className="text-sm font-black text-indigo-600">
                  60s (Slide 10s)
                </span>
              </div>
            </div>
          </div>

          {/* <div className="bg-linear-to-br from-gray-900 to-gray-800 p-8 rounded-3xl text-white">
            <Server className="w-10 h-10 text-orange-500 mb-6" />
            <h3 className="text-xl font-bold mb-2">Cluster Status</h3>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Opérationnel
            </div>
            <div className="space-y-2 opacity-60 text-xs font-medium">
              <p>• 3 Workers actifs</p>
              <p>• 8.4 GB RAM allouée</p>
              <p>• Latence : 142ms</p>
            </div>
          </div> */}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 bg-white rounded-4xl border border-gray-100 p-2 min-h-[600px]">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-500" />
              Résultats d'Agrégation Temps Réel
            </h3>
            <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-3 py-1 rounded-full uppercase">
              Live Stream
            </span>
          </div>
          <div className="p-4">
            <SparkInsights />
          </div>
        </div>
      </div>
    </div>
  );
}
