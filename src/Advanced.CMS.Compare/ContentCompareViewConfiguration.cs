﻿using EPiServer.Core;
using EPiServer.ServiceLocation;
using EPiServer.Shell;

namespace Advanced.CMS.Compare
{
    [ServiceConfiguration(typeof(EPiServer.Shell.ViewConfiguration))]
    public class ContentCompareViewConfiguration : ViewConfiguration<IContentData>
    {
        public ContentCompareViewConfiguration()
        {
            this.Key = "contentcompare";
            this.ControllerType = "advanced-cms-compare/content-compare-view-controller";
            this.ViewType = "advanced-cms-compare/compare-view";
            this.IconClass = "epi-iconCompare";
            this.HideFromViewMenu = true;
        }
    }
}
