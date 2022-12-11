using System;
using System.Linq;
using EPiServer.Shell.Modules;
using Microsoft.Extensions.DependencyInjection;

namespace Advanced.CMS.Compare;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddTimeProperty(this IServiceCollection services)
    {
        services.Configure<ProtectedModuleOptions>(
            pm =>
            {
                if (!pm.Items.Any(i =>
                        i.Name.Equals("advanced-cms-time-property", StringComparison.OrdinalIgnoreCase)))
                {
                    pm.Items.Add(new ModuleDetails { Name = "advanced-cms-compare" });
                }
            });

        return services;
    }
}
