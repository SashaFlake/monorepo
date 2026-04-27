// TODO: диалог подтверждения удаления
import {RoutingRule} from "@/features/routing-rules";
import {Button} from "@/components/ui/button.tsx";
import * as React from "react";

interface DeleteRuleDialogProps {
    rule: RoutingRule       // чтобы показать имя
    isPending: boolean      // блокировать кнопки во время запроса
    onConfirm: () => void
    onCancel: () => void
}
export function DeleteRuleDialog(props : DeleteRuleDialogProps) {

    return (
        <div style={backdropStyle} onClick={props.onCancel}>

            <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
                <h2>Deleting routing rule?</h2>
                <p>You are about to delete "{props.rule.name}"</p>
                <p>This action will remove the rule from traffic routing.</p>
            </div>
            <div style={actionsStyle}>
                <Button variant={"ghost"} onClick={props.onCancel} disabled={props.isPending}>
                    {props.isPending ? 'Deleting' : 'Delete'}
                </Button>
            </div>
        </div>
        )
}
const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'oklch(from var(--color-bg) l c h / 0.7)',
    backdropFilter: 'blur(4px)',
    padding: 'var(--space-4)',
}
const dialogStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 480,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-lg)',
    padding: 'var(--space-6)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
}
const actionsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--space-2)',
    paddingTop: 'var(--space-2)',
    borderTop: '1px solid var(--color-divider)',
}