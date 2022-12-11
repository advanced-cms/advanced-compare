using System;
using System.Globalization;
using System.Linq;
using EPiServer;
using EPiServer.Core;
using EPiServer.Globalization;
using EPiServer.ServiceLocation;
using EPiServer.Web;
using Microsoft.AspNetCore.Http;

namespace Advanced.CMS.Compare
{
    public class ContentByDateLoader : IContentAreaLoader
    {
        private readonly IContentAreaLoader _defaultContentAreaLoader;
        private readonly IContextModeResolver _contextModeResolver;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ContentByDateLoader(IContentAreaLoader defaultContentAreaLoader,
            IContextModeResolver contextModeResolver,
            IHttpContextAccessor httpContextAccessor)
        {
            _defaultContentAreaLoader = defaultContentAreaLoader;
            _contextModeResolver = contextModeResolver;
            _httpContextAccessor = httpContextAccessor;
        }

        public ContentByDateLoader(IContentAreaLoader defaultContentAreaLoader)
        {
            _defaultContentAreaLoader = defaultContentAreaLoader;
            _contextModeResolver = ServiceLocator.Current.GetInstance<IContextModeResolver>();
            _httpContextAccessor = ServiceLocator.Current.GetInstance<IHttpContextAccessor>();
        }

        public IContent Get(ContentAreaItem contentAreaItem)
        {
            if (_contextModeResolver.CurrentMode != ContextMode.Edit)
            {
                return _defaultContentAreaLoader.Get(contentAreaItem);
            }

            var maxContentDate = MaxContentDate;
            if (maxContentDate.HasValue == false)
            {
                return _defaultContentAreaLoader.Get(contentAreaItem);
            }
            
            var languageResolver = ServiceLocator.Current.GetInstance<LanguageResolver>();
            var contentVersionRepository = ServiceLocator.Current.GetInstance<IContentVersionRepository>();

            var language = languageResolver.GetPreferredCulture().Name;

            var contentVersions = contentVersionRepository.List(contentAreaItem.ContentLink.ToReferenceWithoutVersion(), language).ToList();
            if (contentVersions.Count < 2)
            {
                return _defaultContentAreaLoader.Get(contentAreaItem);
            }
            var version = contentVersions.Where(x => x.Saved < maxContentDate).OrderByDescending(x => x.Saved).FirstOrDefault();

            var contentLoader = ServiceLocator.Current.GetInstance<IContentLoader>();

            if (version == null)
            {
                var oldestVersion = contentVersions.OrderBy(x => x.Saved).First();
                if (maxContentDate.Value <= oldestVersion.Saved)
                {
                    var oldestContent = contentLoader.Get<IContent>(oldestVersion.ContentLink);
                    contentAreaItem.ContentLink = oldestVersion.ContentLink;
                    return oldestContent;
                }
                var newestVersion = contentVersions.OrderByDescending(x => x.Saved).First();
                if (maxContentDate.Value <= newestVersion.Saved)
                {
                    var newestContent = contentLoader.Get<IContent>(newestVersion.ContentLink);
                    contentAreaItem.ContentLink = newestVersion.ContentLink;
                    return newestContent;
                }

                return _defaultContentAreaLoader.Get(contentAreaItem);
            }

            var content = contentLoader.Get<IContent>(version.ContentLink);
            contentAreaItem.ContentLink = version.ContentLink;
            return content;
        }

        public DisplayOption LoadDisplayOption(ContentAreaItem contentAreaItem)
        {
            return _defaultContentAreaLoader.LoadDisplayOption(contentAreaItem);
        }

        private DateTime? MaxContentDate
        {
            get
            {
                if (_httpContextAccessor.HttpContext == null)
                {
                    return null;
                }

                var maxContentDateStr = _httpContextAccessor.HttpContext.Request.Query["maxContentDate"];
                if (string.IsNullOrWhiteSpace(maxContentDateStr))
                {
                    return null;
                }

                if (!DateTime.TryParseExact(maxContentDateStr, "yyyy-MM-dd-HH-mm-ss", CultureInfo.InvariantCulture,
                    DateTimeStyles.None, out var parsedDate))
                {
                    return null;
                }

                return parsedDate;
            }
        }

    }
}
