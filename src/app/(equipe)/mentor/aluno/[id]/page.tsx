"use client";

import React from "react";
import { FichaAcompanhamento } from "@/components/diagnostico/equipe/FichaAcompanhamento";

export default function FichaMentorPage({ params }: { params: { id: string } }) {
  return <FichaAcompanhamento matriculaId={params.id} modo="mentor" />;
}
