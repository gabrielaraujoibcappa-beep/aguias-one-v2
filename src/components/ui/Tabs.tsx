"use client";

import React, { useState, useRef, useEffect } from "react";

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  activeTabId?: string;
  onChange?: (tabId: string) => void;
  ariaLabel: string;
  className?: string;
}

/**
 * Função utilitária pura para navegação acessível por teclado (Roving Tabindex).
 * Conforme W3C WAI-ARIA Authoring Practices para Tabs.
 */
export function calcularProximaAba(
  tabIds: string[],
  currentId: string,
  key: "ArrowRight" | "ArrowLeft" | "Home" | "End",
  disabledIds: Set<string> = new Set()
): string {
  const disponiveis = tabIds.filter((id) => !disabledIds.has(id));
  if (disponiveis.length === 0) return currentId;

  const currentIndex = disponiveis.indexOf(currentId);

  if (key === "Home") {
    return disponiveis[0];
  }

  if (key === "End") {
    return disponiveis[disponiveis.length - 1];
  }

  if (key === "ArrowRight") {
    if (currentIndex === -1 || currentIndex === disponiveis.length - 1) {
      return disponiveis[0];
    }
    return disponiveis[currentIndex + 1];
  }

  if (key === "ArrowLeft") {
    if (currentIndex === -1 || currentIndex === 0) {
      return disponiveis[disponiveis.length - 1];
    }
    return disponiveis[currentIndex - 1];
  }

  return currentId;
}

/**
 * Componente Tabs em conformidade com W3C WAI-ARIA, NN/g, Carbon (IBM) e Cohere 2026.
 * - Suporta Roving Tabindex e setas do teclado.
 * - Não corta texto em telas móveis (rolagem horizontal fluida).
 * - Distinção visual clara da aba ativa (linha inferior sólida + contraste).
 */
export function Tabs({
  tabs,
  defaultTabId,
  activeTabId,
  onChange,
  ariaLabel,
  className = "",
}: TabsProps) {
  const [internalActiveId, setInternalActiveId] = useState<string>(
    defaultTabId || (tabs[0] ? tabs[0].id : "")
  );

  const currentTabId = activeTabId !== undefined ? activeTabId : internalActiveId;
  const tabButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const handleSelectTab = (id: string) => {
    if (activeTabId === undefined) {
      setInternalActiveId(id);
    }
    onChange?.(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, id: string) => {
    if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      const allIds = tabs.map((t) => t.id);
      const disabledSet = new Set(tabs.filter((t) => t.disabled).map((t) => t.id));
      const nextId = calcularProximaAba(
        allIds,
        id,
        e.key as "ArrowRight" | "ArrowLeft" | "Home" | "End",
        disabledSet
      );

      handleSelectTab(nextId);
      // Foca automaticamente a próxima aba selecionada
      setTimeout(() => {
        tabButtonRefs.current[nextId]?.focus();
      }, 0);
    }
  };

  const activeTab = tabs.find((t) => t.id === currentTabId) || tabs[0];

  return (
    <div className={`tabs-container ${className}`} style={{ width: "100%" }}>
      {/* Barra de Abas (Tablist) */}
      <div
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation="horizontal"
        style={{
          display: "flex",
          borderBottom: "1px solid var(--cor-border-light)",
          gap: "var(--espaco-lg)",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          marginBottom: "var(--espaco-lg)",
        }}
      >
        {tabs.map((tab) => {
          const isSelected = tab.id === currentTabId;

          return (
            <button
              key={tab.id}
              ref={(el) => { tabButtonRefs.current[tab.id] = el; }}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isSelected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isSelected ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => handleSelectTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, tab.id)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: isSelected ? "2px solid var(--cor-deep-green)" : "2px solid transparent",
                color: isSelected ? "#111827" : "var(--cor-muted)",
                fontWeight: isSelected ? 600 : 500,
                fontSize: "14px",
                padding: "10px 4px",
                cursor: tab.disabled ? "not-allowed" : "pointer",
                opacity: tab.disabled ? 0.5 : 1,
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                transition: "color 0.15s ease, border-color 0.15s ease",
                marginBottom: "-1px",
                outline: "none",
              }}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2px 7px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: "11px",
                    fontWeight: 600,
                    fontFamily: "var(--font-family-mono)",
                    backgroundColor: isSelected ? "var(--cor-deep-green)" : "var(--cor-soft-stone)",
                    color: isSelected ? "#fff" : "var(--cor-muted)",
                    minWidth: "18px",
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Painel da Aba Selecionada (Tabpanel) */}
      {activeTab && (
        <div
          role="tabpanel"
          id={`panel-${activeTab.id}`}
          aria-labelledby={`tab-${activeTab.id}`}
          tabIndex={0}
          style={{ outline: "none" }}
        >
          {activeTab.content}
        </div>
      )}
    </div>
  );
}
