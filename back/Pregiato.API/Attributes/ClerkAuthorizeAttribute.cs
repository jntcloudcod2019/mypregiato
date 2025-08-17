using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Pregiato.API.Services;
using System.Security.Claims;

namespace Pregiato.API.Attributes
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class ClerkAuthorizeAttribute : Attribute, IAuthorizationFilter
    {
        private readonly string[] _requiredRoles;

        public ClerkAuthorizeAttribute(params string[] requiredRoles)
        {
            _requiredRoles = requiredRoles;
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var user = context.HttpContext.User;
            var clerkAuthService = context.HttpContext.RequestServices.GetService<IClerkAuthService>();

            if (clerkAuthService == null)
            {
                context.Result = new StatusCodeResult(500);
                return;
            }

            // Verificar se o usuário está autenticado
            if (!clerkAuthService.IsAuthenticated(user))
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            // Se não há roles específicas requeridas, apenas autenticação é suficiente
            if (_requiredRoles == null || _requiredRoles.Length == 0)
            {
                return;
            }

            // Verificar se o usuário tem pelo menos uma das roles requeridas
            var userRoles = user.Claims
                .Where(c => c.Type == ClaimTypes.Role)
                .Select(c => c.Value)
                .ToList();

            // Se não há roles definidas no token, verificar se é ADMIN (fallback)
            if (!userRoles.Any())
            {
                var userEmail = clerkAuthService.GetCurrentUserEmail(user);
                if (string.IsNullOrEmpty(userEmail))
                {
                    context.Result = new ForbidResult();
                    return;
                }

                // Aqui você pode fazer uma consulta ao banco para verificar a role do usuário
                // Por enquanto, vamos assumir que usuários com email específico são ADMIN
                if (userEmail.Contains("admin"))
                {
                    userRoles.Add("ADMIN");
                }
                else
                {
                    userRoles.Add("USER");
                }
            }

            var hasRequiredRole = _requiredRoles.Any(requiredRole => 
                userRoles.Any(userRole => 
                    string.Equals(userRole, requiredRole, StringComparison.OrdinalIgnoreCase)));

            if (!hasRequiredRole)
            {
                context.Result = new ForbidResult();
            }
        }
    }

    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class ClerkAdminAttribute : ClerkAuthorizeAttribute
    {
        public ClerkAdminAttribute() : base("ADMIN") { }
    }

    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class ClerkOperatorAttribute : ClerkAuthorizeAttribute
    {
        public ClerkOperatorAttribute() : base("OPERATOR", "ADMIN") { }
    }
}
