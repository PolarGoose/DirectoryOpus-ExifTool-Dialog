var exifTool = new ActiveXObject("DOpusScriptingExtensions.ExifTool")

function OnInit(data) {
  data.name = "ExifTool dialog"
  data.desc = "Shows file metadata using ExifTool"
  data.version = "0.0-dev"
  data.url = "https://github.com/PolarGoose/DirectoryOpus-ExifTool-Dialog"
  data.default_enable = true

  var cmd = data.AddCommand()
  cmd.name = "Open ExifTool dialog"
  cmd.method = "onCommandExecuted"
  cmd.desc = data.desc
  cmd.label = data.desc
}

function onCommandExecuted(/* ScriptCommandData */ scriptCommandData) {
  try {
    var selectedFiles = scriptCommandData.func.sourcetab.selected_files

    if (selectedFiles.Count == 0) {
      throw "Please select a file."
    }

    var selectedFile = getFirstElementOfCollection(selectedFiles)
    var exifToolData = getExifToolData(selectedFile.realpath)

    var dlg = DOpus.Dlg;
    dlg.template = "main";
    dlg.Create()
    dlg.Control("FileName").value = selectedFile.realpath;
    AddExifToolDataToListView(dlg.Control("ExifTags"), exifToolData)

    dlg.RunDlg();
  } catch (error) {
    var dlg = scriptCommandData.func.sourcetab.dlg
    dlg.message = error;
    dlg.buttons = "OK";
    dlg.icon = "error";
    dlg.show()
  }
}

function AddExifToolDataToListView(/* Control */ listView, tagNameAndValueArray) {
  for (var i = new Enumerator(tagNameAndValueArray); !i.atEnd(); i.moveNext()) {
    tag = i.item();
    AddItemToListView(listView, tag.TagName, tag.Value)
  }
  listView.columns.autosize();
}

function AddItemToListView(/* Control */ listView, /* string */ tagName, /* string */ value) {
  var i = listView.AddItem(tagName);
  listView.GetItemAt(i).subitems(0) = value;

  if(tagName === "") {
    listView.GetItemAt(i).style = "b"
  }
}

function getExifToolData(/* string */ filePath) {
  var tags = JSON.parse(exifTool.GetInfoAsJson(filePath))[0]

  var result = []
  var currentShortenedGroupName = ""
  for (var tagFullName in tags) {
    if (tagFullName === "SourceFile") {
      continue
    }

    var shortenedGroupName = getTagGroupShortened(tagFullName)
    if(shortenedGroupName !== currentShortenedGroupName) {
      result.push({ "TagName": "", "Value": "--- " + shortenedGroupName + " ---" })
      currentShortenedGroupName = shortenedGroupName
    }

    result.push({ "TagName": getTagName(tagFullName), "Value": tags[tagFullName].val })
  }

  return result
}

// Extracts the tag name from the full tag name:
//   QuickTime:Meta:TagName => TagName
function getTagName(/* string */ fullTagName) {
  var idx = fullTagName.lastIndexOf(":");
  return fullTagName.substring(idx + 1)
}

// Extract the tag group:
//   QuickTime:QuickTime:TagName => QuickTime
//   QuickTime:Meta:TagName => QuickTime:Meta
function getTagGroupShortened(/* string */ fullTagName) {
  var parts = fullTagName.split(":");
  parts.pop();
  if (parts[0] === parts[1]) {
    return parts[0];
  }
  return parts.join(":");
}

function getFirstElementOfCollection(collection) {
  var e = new Enumerator(collection)
  e.moveFirst()
  return e.item()
}

==SCRIPT RESOURCES
<resources>
  <resource name="main" type="dialog">
    <dialog height="300" lang="english" title="ExifTool dialog" width="421">
      <control halign="left" height="12" name="FileName" readonly="yes" title="Edit Control" type="edit" width="402" x="19" y="0" />
      <control fullrow="yes" height="285" name="ExifTags" nosortheader="yes" type="listview" viewmode="details" width="421" x="0" y="15">
        <columns>
          <item text="Tag name" />
          <item text="Value" />
        </columns>
      </control>
      <control halign="left" height="8" name="static1" title="File:" type="static" valign="top" width="15" x="2" y="1" />
    </dialog>
  </resource>
</resources>
