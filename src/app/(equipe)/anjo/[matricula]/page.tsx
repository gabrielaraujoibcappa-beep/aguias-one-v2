"use client";

import React from "react";
import { FichaAcompanhamento } from "@/components/diagnostico/equipe/FichaAcompanhamento";

export default function FichaAnjoPage({ params }: { params: { matricula: string } }) {
  return <FichaAcompanhamento matriculaId={params.matricula} modo="anjo" />;
}
