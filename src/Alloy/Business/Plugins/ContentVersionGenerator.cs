using System;
using Alloy.Models.Blocks;
using Alloy.Models.Pages;
using EPiServer;
using EPiServer.Core;
using EPiServer.DataAccess;
using EPiServer.Framework;
using EPiServer.Security;

namespace Alloy.Business.Plugins
{
    public class ContentVersionGenerator
    {
        private readonly IContentRepository _contentRepository;
        private readonly IContentVersionRepository _contentVersionRepository;

        public ContentVersionGenerator(IContentRepository contentRepository, IContentVersionRepository contentVersionRepository)
        {
            _contentRepository = contentRepository;
            _contentVersionRepository = contentVersionRepository;
        }

        public IContent CreateContentVersion(ContentReference contentLink, DateTime versionDate, string data1, string data2, string data3)
        {
            ContextCache.Current["CurrentITransferContext"] = (object)this;
            ContextCache.Current["PageSaveDB:PageSaved"] = (object)true;

            var content = _contentRepository.Get<IContent>(contentLink);


            var saveAction = SaveAction.Publish | SaveAction.SkipValidation;
            var command = saveAction & SaveAction.ActionMask;
            SaveAction action = (content is IVersionable ? command : SaveAction.Default) | (SaveAction.ForceCurrentVersion | saveAction & SaveAction.SkipValidation);
            AccessLevel requiredDestinationAccess = AccessLevel.NoAccess;

            var contentData = content as ContentData;
            contentData = (ContentData) contentData.CreateWritableClone();

            IChangeTrackable changeTrackable = contentData as IChangeTrackable;
            changeTrackable.Saved = versionDate;
            changeTrackable.Changed = versionDate;
            changeTrackable.Created = versionDate;
            changeTrackable.SetChangedOnPublish = true;

            IContent contentClone = (IContent)contentData;
            contentClone.ContentLink = contentLink.ToReferenceWithoutVersion();
            contentClone.ContentGuid = Guid.Empty;

            if (contentClone is EditorialBlock)
            {
                contentClone.Property["MainBody"].Value = new XhtmlString(data1);
            }
            else if (contentClone is StandardPage)
            {
                contentClone.Property["PageName"].Value = data1;
                contentClone.Property["MetaDescription"].Value = data2;
                var contentArea = new ContentArea();
                var contentLinks = data3.Split(new string[] { Environment.NewLine }, StringSplitOptions.RemoveEmptyEntries);
                foreach (var link in contentLinks)
                {
                    contentArea.Items.Add(new ContentAreaItem
                    {
                        ContentLink = new ContentReference(link)
                    });
                }
                contentClone.Property["MainContentArea"].Value = contentArea;
            }

            (contentClone as IVersionable).StartPublish = versionDate;

            SaveAction saveAction2 = (SaveAction.SkipValidation | SaveAction.Publish) & SaveAction.ActionMask;
            var contentReference = _contentRepository.Save(contentClone, saveAction2, requiredDestinationAccess);

            return content;
        }
    }
}
