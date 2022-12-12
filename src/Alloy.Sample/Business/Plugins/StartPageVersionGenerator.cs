using System;
using System.Linq;
using Alloy.Sample.Models.Blocks;
using Alloy.Sample.Models.Pages;
using EPiServer;
using EPiServer.Core;
using EPiServer.DataAccess;
using EPiServer.Framework;
using EPiServer.Security;

namespace Alloy.Business.Plugins
{
    public class StartPageVersionGenerator
    {
        private readonly IContentRepository _contentRepository;

        public StartPageVersionGenerator(IContentRepository contentRepository, IContentVersionRepository contentVersionRepository)
        {
            _contentRepository = contentRepository;
        }

        public void CreateVersions()
        {
            AccessLevel requiredDestinationAccess = AccessLevel.NoAccess;

            ContextCache.Current["CurrentITransferContext"] = (object)this;
            ContextCache.Current["PageSaveDB:PageSaved"] = (object)true;

            var startPage = _contentRepository.Get<StartPage>(ContentReference.StartPage);

            var jumbotronBlock = startPage.MainContentArea.Items
                .Select(x => _contentRepository.Get<IContent>(x.ContentLink)).OfType<JumbotronBlock>().FirstOrDefault();

            // create versions for Jumbotron block
            var currentDate = DateTime.Now;
            for (var i = 1; i < 30; i++)
            {
                var clone = (JumbotronBlock)jumbotronBlock.CreateWritableClone();
                var newDate = currentDate.AddMonths(-i);
                clone.ButtonText = clone.ButtonText + " " + newDate.ToString("yyyy MMM");
                clone.Heading = clone.Heading + " " + newDate.ToString("yyyy MMM");

                var changeTrackable = clone as IChangeTrackable;
                changeTrackable.Saved = newDate;
                changeTrackable.Changed = newDate;
                changeTrackable.Created = newDate;
                changeTrackable.SetChangedOnPublish = true;

                IContent contentData = (IContent)clone;
                contentData.ContentLink = contentData.ContentLink.ToReferenceWithoutVersion();
                contentData.ContentGuid = Guid.Empty;

                (clone as IVersionable).StartPublish = newDate;

                SaveAction saveAction2 = (SaveAction.SkipValidation | SaveAction.Publish) & SaveAction.ActionMask;
                var contentReference = _contentRepository.Save(contentData, saveAction2, requiredDestinationAccess);
            }

            // create versions for Start Page
            for (var i = 1; i < 15; i++)
            {
                var clone = (StartPage)startPage.CreateWritableClone();
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

                SaveAction saveAction2 = (SaveAction.SkipValidation | SaveAction.Publish) & SaveAction.ActionMask;
                var contentReference = _contentRepository.Save(contentData, saveAction2, requiredDestinationAccess);
            }
        }
    }
}
