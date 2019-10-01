using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net;
using EPiServer;
using EPiServer.Core;
using EPiServer.Core.Internal;
using EPiServer.Globalization;
using EPiServer.Shell.Services.Rest;

namespace AdvancedCMS.Compare
{
    [RestStore("contentcomparestore")]
    public class ContentCompareStore : RestControllerBase
    {
        private readonly IContentVersionRepository _contentVersionRepository;
        private readonly LanguageResolver _languageResolver;
        private readonly ContentSoftLinkIndexer _contentSoftLinkIndexer;
        private readonly IContentLoader _contentLoader;

        public ContentCompareStore(IContentVersionRepository contentVersionRepository,
            LanguageResolver languageResolver, ContentSoftLinkIndexer contentSoftLinkIndexer,
            IContentLoader contentLoader)
        {
            _contentVersionRepository = contentVersionRepository;
            _languageResolver = languageResolver;
            _contentSoftLinkIndexer = contentSoftLinkIndexer;
            _contentLoader = contentLoader;
        }

        /// <summary>
        /// Returns content version by date
        /// </summary>
        /// <param name="contentLink">Version agnostic content id</param>
        /// <param name="date">Date of version</param>
        /// <returns>ContentReference to version available at <see cref="date"/></returns>
        public RestResultBase GetContentVersionByDate(ContentReference contentLink, DateTime date, string language)
        {
            if (ContentReference.IsNullOrEmpty(contentLink))
            {
                return new RestStatusCodeResult(HttpStatusCode.Conflict);
            }

            if (string.IsNullOrWhiteSpace(language))
            {
                language = _languageResolver.GetPreferredCulture().Name;
            }

            var contentVersions = _contentVersionRepository.List(contentLink.ToReferenceWithoutVersion(), language).ToList();
            if (!contentVersions.Any())
            {
                return Rest(null);
            }
            
            var version = contentVersions.Where(x=>x.Saved < date).OrderByDescending(x=> x.Saved).FirstOrDefault();

            if (version == null)
            {
                var oldestVersion = contentVersions.OrderBy(x => x.Saved).First();
                if (date <= oldestVersion.Saved )
                {
                    return Rest(oldestVersion.ContentLink);
                }
                var newestVersion = contentVersions.OrderByDescending(x => x.Saved).First();
                if (date <= newestVersion.Saved)
                {
                    return Rest(newestVersion.ContentLink);
                }
            }

            return Rest(version?.ContentLink);
        }

        /// <summary>
        /// Get all contents that reference content for all content versions
        /// </summary>
        /// <returns></returns>
        public RestResultBase GetAllReferencedContents(ContentReference contentLink, string language)
        {
            if (ContentReference.IsNullOrEmpty(contentLink))
            {
                return new RestStatusCodeResult(HttpStatusCode.Conflict);
            }

            if (string.IsNullOrWhiteSpace(language))
            {
                language = _languageResolver.GetPreferredCulture().Name;
            }

            var contentVersions = _contentVersionRepository.List(contentLink.ToReferenceWithoutVersion(), language).ToList();
            if (!contentVersions.Any())
            {
                return Rest(null);
            }

            // min content version date. Before this date, the referenced content won't affect the content
            var minVersionDate = contentVersions.Select(x=>x.Saved).Min();

            // get all references to the content for all content versions
            var references = new List<ContentReference>();
            foreach (var contentVersion in contentVersions)
            {
                var content = _contentLoader.Get<IContent>(contentVersion.ContentLink, new CultureInfo(language));
                var contentReferences = _contentSoftLinkIndexer.GetLinks(content)
                    .Select(x => x.ReferencedContentLink.ToReferenceWithoutVersion())
                    .Where(x => !ContentReference.IsNullOrEmpty(x));
                references.AddRange(contentReferences);
            }

            var result = new List<ReferencedContentViewModel>();
            references = references.Distinct().ToList();

            // for distinct references get viewmodels with id, name and date
            foreach (var contentReference in references)
            {
                var referenceVerions = _contentVersionRepository.List(contentReference, language).ToList();

                foreach (var referenceVerion in referenceVerions)
                {
                    if (referenceVerion.Saved < minVersionDate)
                    {
                        continue;
                    }
                    result.Add(new ReferencedContentViewModel
                    {
                        ContentLink = referenceVerion.ContentLink,
                        Name = referenceVerion.Name,
                        SavedDate = referenceVerion.Saved.ToString("o")
                    });
                }
            }

            return Rest(result);
        }
    }

    public class ReferencedContentViewModel
    {
        public ContentReference ContentLink { get; set; }
        public string Name { get; set; }
        public string SavedDate { get; set; }
    }
}
