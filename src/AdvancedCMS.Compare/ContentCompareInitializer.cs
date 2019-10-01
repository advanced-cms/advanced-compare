﻿using EPiServer.Framework;
using EPiServer.Framework.Initialization;
using EPiServer.Labs.BlockEnhancements.ContentCompare;
using EPiServer.ServiceLocation;
using EPiServer.Web;

namespace AdvancedCMS.Compare
{
    [ModuleDependency(typeof(EPiServer.Web.InitializationModule))]
    public class ContentCompareInitializer : IConfigurableModule
    {
        public void ConfigureContainer(ServiceConfigurationContext context)
        {
            context.Services.Intercept<IContentAreaLoader>(
                (locator, defaultContentAreaLoader) => new ContentByDateLoader(defaultContentAreaLoader));
        }
        public void Initialize(InitializationEngine context) { }
        public void Uninitialize(InitializationEngine context) { }
    }
}
