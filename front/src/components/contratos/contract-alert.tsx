import { Alert, AlertDescription } from "../ui/alert"
import { Button } from "../ui/button"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { cn } from "../../lib/utils"

interface ContractAlertProps {
  type: "success" | "warning"
  title: string
  message: string
  onAction?: () => void
  actionLabel?: string
  onSecondaryAction?: () => void
  secondaryActionLabel?: string
}

export function ContractAlert({ 
  type, 
  title, 
  message, 
  onAction, 
  actionLabel,
  onSecondaryAction,
  secondaryActionLabel 
}: ContractAlertProps) {
  return (
    <Alert className={cn(
      "animate-fade-in border-2",
      type === "success" ? "border-green-500/20 bg-green-50 dark:bg-green-950/20" : "border-yellow-500/20 bg-yellow-50 dark:bg-yellow-950/20"
    )}>
      <div className="flex items-start gap-3">
        {type === "success" ? (
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
        )}
        <div className="flex-1 space-y-2">
          <h4 className={cn(
            "font-semibold",
            type === "success" ? "text-green-800 dark:text-green-200" : "text-yellow-800 dark:text-yellow-200"
          )}>
            {title}
          </h4>
          <AlertDescription className={cn(
            type === "success" ? "text-green-700 dark:text-green-300" : "text-yellow-700 dark:text-yellow-300"
          )}>
            {message}
          </AlertDescription>
          {(onAction || onSecondaryAction) && (
            <div className="flex gap-2 pt-2">
              {onAction && (
                <Button
                  onClick={onAction}
                  size="sm"
                  variant={type === "success" ? "default" : "destructive"}
                  className={cn(
                    type === "success" 
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "bg-yellow-600 hover:bg-yellow-700 text-white"
                  )}
                >
                  {actionLabel || "OK"}
                </Button>
              )}
              {onSecondaryAction && (
                <Button
                  onClick={onSecondaryAction}
                  size="sm"
                  variant="outline"
                  className="border-current"
                >
                  {secondaryActionLabel || "Cancelar"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Alert>
  )
}