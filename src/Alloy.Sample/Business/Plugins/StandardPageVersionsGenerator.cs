using System;
using Alloy.Sample.Models.Blocks;
using Alloy.Sample.Models.Pages;
using EPiServer;
using EPiServer.Cms.Shell.UI.Rest;
using EPiServer.Core;
using EPiServer.DataAccess;
using EPiServer.Framework;
using EPiServer.Security;

namespace Alloy.Business.Plugins
{
    public class StandardPageVersionsGenerator
    {
        private readonly IContentRepository _contentRepository;
        private readonly IContentChangeManager _contentChangeManager;

        public StandardPageVersionsGenerator(IContentRepository contentRepository, IContentChangeManager contentChangeManager)
        {
            _contentRepository = contentRepository;
            _contentChangeManager = contentChangeManager;
        }

        public ContentReference CreateVersions(string defaultName)
        {
            var editorialBlock1 = CreateEditorialBlock(1, ContentReference.GlobalBlockFolder);
            var editorialBlock2 = CreateEditorialBlock(1, ContentReference.GlobalBlockFolder);
            var editorialBlock3 = CreateEditorialBlock(1, ContentReference.GlobalBlockFolder);
            // create standard page
            var standardPage = _contentRepository.GetDefault<StandardPage>(ContentReference.StartPage);
            standardPage.Name = defaultName;
            standardPage.MetaDescription = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut rhoncus turpis laoreet nisl pulvinar, vitae ultricies ligula dictum. Quisque feugiat viverra ipsum quis convallis.";
            standardPage.MainBody = new XhtmlString("Etiam convallis in arcu eu tincidunt. Ut laoreet eu ante at laoreet. Cras auctor metus sed nunc rutrum tincidunt ut vel erat. Suspendisse in finibus augue.");
            standardPage.MainContentArea = new ContentArea()
            {
                Items =
                {
                    new ContentAreaItem
                    {
                        ContentLink = ((IContent)editorialBlock1).ContentLink
                    },
                    new ContentAreaItem
                    {
                        ContentLink = ((IContent)editorialBlock2).ContentLink
                    },
                    new ContentAreaItem
                    {
                        ContentLink = ((IContent)editorialBlock3).ContentLink
                    }
                }
            };
            SaveAction saveAction2 = (SaveAction.SkipValidation | SaveAction.Publish) & SaveAction.ActionMask;
            var contentReference = _contentRepository.Save(standardPage, saveAction2, AccessLevel.NoAccess);

            var assetsFolderContentLink = _contentChangeManager.GetOrCreateContentAssetsFolder(contentReference);
            MoveEditorialBlock(editorialBlock1, assetsFolderContentLink);
            MoveEditorialBlock(editorialBlock2, assetsFolderContentLink);
            MoveEditorialBlock(editorialBlock3, assetsFolderContentLink);

            ContextCache.Current["CurrentITransferContext"] = (object)this;
            ContextCache.Current["PageSaveDB:PageSaved"] = (object)true;


            // create versions for contnts
            var currentDate = DateTime.Now;
            for (var i = 1; i < 30; i++)
            {
                UpdateEditorialBlock(editorialBlock1, currentDate.AddMonths(-i));
                if (i % 2 != 0)
                {
                    UpdateEditorialBlock(editorialBlock2, currentDate.AddMonths(-i).AddDays(-i % 5 + 1));
                }
                if (i % 3 != 0)
                {
                    UpdateEditorialBlock(editorialBlock3, currentDate.AddMonths(-i).AddDays(-i % 3 + 1));
                }
            }

            standardPage = _contentRepository.Get<StandardPage>(contentReference);
            // create versions for standard page
            for (var i = 1; i < 15; i++)
            {
                var clone = (StandardPage)standardPage.CreateWritableClone();
                var newDate = currentDate.AddMonths(-i * 2).AddDays(-1);
                clone.Name = clone.Name + " " + newDate.ToString("yyyy-MM-dd");

                var changeTrackable = clone as IChangeTrackable;
                changeTrackable.Saved = newDate;
                changeTrackable.Changed = newDate;
                changeTrackable.Created = newDate;
                changeTrackable.SetChangedOnPublish = true;

                IContent contentData = (IContent)clone;
                contentData.ContentLink = contentData.ContentLink.ToReferenceWithoutVersion();
                contentData.ContentGuid = Guid.Empty;

                (clone as IVersionable).StartPublish = newDate;

                _contentRepository.Save(contentData, saveAction2, AccessLevel.NoAccess);
            }

            return contentReference;
        }

        private void UpdateEditorialBlock(EditorialBlock editorialBlock, DateTime date)
        {
            var clone = (EditorialBlock)editorialBlock.CreateWritableClone();
            clone.MainBody = new XhtmlString("Text " + date.ToString("yyyy MMM dd"));

            var changeTrackable = clone as IChangeTrackable;
            changeTrackable.Saved = date;
            changeTrackable.Changed = date;
            changeTrackable.Created = date;
            changeTrackable.SetChangedOnPublish = true;

            IContent contentData = (IContent)clone;
            contentData.ContentLink = contentData.ContentLink.ToReferenceWithoutVersion();
            contentData.ContentGuid = Guid.Empty;

            (clone as IVersionable).StartPublish = date;

            SaveAction saveAction2 = (SaveAction.SkipValidation | SaveAction.Publish) & SaveAction.ActionMask;
            var contentReference = _contentRepository.Save(contentData, saveAction2, AccessLevel.NoAccess);

        }

        private EditorialBlock CreateEditorialBlock(int index, ContentReference parentLink)
        {
            var editorial = _contentRepository.GetDefault<EditorialBlock>(parentLink);
            ((IContent)editorial).Name = "EditorialBlock" + index;
            editorial.MainBody = new XhtmlString("Test");

            SaveAction saveAction2 = (SaveAction.SkipValidation | SaveAction.Publish) & SaveAction.ActionMask;
            var contentReference = _contentRepository.Save((IContent)editorial, saveAction2, AccessLevel.NoAccess);

            return _contentRepository.Get<EditorialBlock>(contentReference);
        }

        private void MoveEditorialBlock(EditorialBlock editorialBlock, ContentReference parentLink)
        {
            _contentRepository.Move(((IContent) editorialBlock).ContentLink, parentLink, AccessLevel.NoAccess, AccessLevel.NoAccess);
        }
    }
}
