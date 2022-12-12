using System;
using System.Collections.Generic;
using System.Globalization;
using EPiServer.Authorization;
using EPiServer.Core;
using EPiServer.Framework;
using EPiServer.Framework.Initialization;
using EPiServer.Shell.Navigation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alloy.Business.Plugins
{
    [MenuProvider]
    public class NewGeneratorAdminMenuProvider : IMenuProvider
    {
        public IEnumerable<MenuItem> GetMenuItems()
        {
            var urlMenuItem1 = new UrlMenuItem("Generate versions", MenuPaths.Global + "/cms/admin/versionsGenerator",
                "/NewsGeneratorPlugin/Index")
            {
                IsAvailable = context => true,
                SortIndex = 100,
            };

            return new List<MenuItem>(1)
            {
                urlMenuItem1
            };
        }
    }

    /*[GuiPlugIn(
        Area = PlugInArea.AdminMenu,
        Url = "/custom-plugins/versions-generator",
        DisplayName = "Content versions generator")]
    [Authorize(Roles = "CmsAdmins")]*/
    [Authorize(Roles = "CmsAdmin,WebAdmins,Administrators")]
    public class NewsGeneratorController : Controller
    {
        private readonly ContentVersionGenerator _contentVersionGenerator;
        private readonly StartPageVersionGenerator _startPageVersionGenerator;
        private readonly StandardPageVersionsGenerator _standardPageVersionsGenerator;

        public NewsGeneratorController(ContentVersionGenerator contentVersionGenerator,
            StartPageVersionGenerator startPageVersionGenerator,
            StandardPageVersionsGenerator standardPageVersionsGenerator)
        {
            _contentVersionGenerator = contentVersionGenerator;
            _startPageVersionGenerator = startPageVersionGenerator;
            _standardPageVersionsGenerator = standardPageVersionsGenerator;
        }

        public ActionResult Index()
        {
            var model = new MyViewModel();
            return View(model);
        }

        [HttpPost]
        public ActionResult Index(MyViewModel model)
        {
            var dateTime = DateTime.ParseExact(model.VersionDate, "yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None);

            var contentVersion = _contentVersionGenerator.CreateContentVersion(ContentReference.Parse(model.ContentLink), dateTime, model.Data1, model.Data2, model.Data3);
            return Content($"Hello {contentVersion?.ContentLink} {model?.VersionDate}");
        }

        [HttpPost]
        public ActionResult UpdateStartPage()
        {
            _startPageVersionGenerator.CreateVersions();
            return Content($"Versions updated");
        }

        [HttpPost]
        public ActionResult CreateStandardPage()
        {
            var result = _standardPageVersionsGenerator.CreateVersions("standardpage");
            return Content("Standard page created: " + result);
        }
    }

    public class MyViewModel
    {
        public string ContentLink { get; set; } = "130";
        public string VersionDate { get; set; } = "2019-03-01 12:20";
        public string Data1 { get; set; }
        public string Data2 { get; set; }
        public string Data3 { get; set; }
    }

    public class PropertyConfiguration
    {
        public string Name { get; set; }
        public string Type { get; set; }
        public string Value { get; set; }
    }

    /*[InitializableModule]
    public class CustomRouteInitialization : IInitializableModule
    {
        public void Initialize(InitializationEngine context)
        {
            RouteTable.Routes.MapRoute(
                null,
                "custom-plugins/versions-generator",
                new { controller = "PageVersionsGenerator", action = "Index" });
        }

        public void Uninitialize(InitializationEngine context)
        {
        }
    }*/
}
