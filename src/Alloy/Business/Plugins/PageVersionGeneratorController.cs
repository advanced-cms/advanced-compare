using System;
using System.Globalization;
using System.Web.Mvc;
using System.Web.Routing;
using EPiServer.Core;
using EPiServer.Framework;
using EPiServer.Framework.Initialization;
using EPiServer.PlugIn;

namespace Alloy.Business.Plugins
{
    [GuiPlugIn(
        Area = PlugInArea.AdminMenu,
        Url = "/custom-plugins/versions-generator",
        DisplayName = "Content versions generator")]
    [Authorize(Roles = "CmsAdmins")]
    public class PageVersionsGeneratorController : Controller
    {
        private readonly ContentVersionGenerator _contentVersionGenerator;
        private readonly StartPageVersionGenerator _startPageVersionGenerator;

        public PageVersionsGeneratorController(ContentVersionGenerator contentVersionGenerator, StartPageVersionGenerator startPageVersionGenerator)
        {
            _contentVersionGenerator = contentVersionGenerator;
            _startPageVersionGenerator = startPageVersionGenerator;
        }

        public ActionResult Index()
        {
            var model = new MyViewModel();
            return View("~/Business/Plugins/Index.cshtml", model);
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

    [InitializableModule]
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
    }
}
