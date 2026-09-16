import { NextRequest, NextResponse } from "next/server";
import { TEMPLATES_CATALOGO, obterTemplatePorId } from "@/lib/email/dados-exemplo";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("id");

    if (templateId) {
      const template = obterTemplatePorId(templateId);
      if (!template) {
        return NextResponse.json(
          { sucesso: false, erro: `Template '${templateId}' não encontrado.` },
          { status: 404 }
        );
      }

      const resultado = template.renderizar();
      return NextResponse.json({
        sucesso: true,
        template: {
          id: template.id,
          nome: template.nome,
          categoria: template.categoria,
          descricao: template.descricao,
        },
        resultado,
      });
    }

    // Retorna todos os templates disponíveis com a prévia renderizada
    const catalogoFormatado = TEMPLATES_CATALOGO.map((t) => {
      const rend = t.renderizar();
      return {
        id: t.id,
        nome: t.nome,
        categoria: t.categoria,
        descricao: t.descricao,
        assunto: rend.assunto,
        preheader: rend.preheader,
      };
    });

    return NextResponse.json({
      sucesso: true,
      totalTemplates: catalogoFormatado.length,
      templates: catalogoFormatado,
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
