using System;
using System.Globalization;
using System.Linq;
using System.Web;
using EPiServer.Core;
using EPiServer.Editor;
using EPiServer.Globalization;
using EPiServer.ServiceLocation;
using EPiServer.Web;

namespace EPiServer.Labs.BlockEnhancements.ContentCompare
{
    public class ContentByDateLoader : IContentAreaLoader
    {
        private readonly IContentAreaLoader _defaultContentAreaLoader;

        public ContentByDateLoader(IContentAreaLoader defaultContentAreaLoader)
        {
            _defaultContentAreaLoader = defaultContentAreaLoader;
        }

        public IContent Get(ContentAreaItem contentAreaItem)
        {
            if (!PageEditing.PageIsInEditMode)
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

        public static DateTime? MaxContentDate
        {
            get
            {
                if (HttpContext.Current == null)
                {
                    return null;
                }

                var maxContentDateStr = HttpContext.Current.Request["maxContentDate"];
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
