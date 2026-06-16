# Volunteer Instructions

Our project is dedicated to digitizing data on spider biodiversity of the Urals.

Learn more about the project: [faunistics.international](https://faunistics.international/)

Old instructions (versions 2.0–3.0): [Instruction v2.0](https://faunistics.international/vol_manual) · [Instruction v1.0 (Notion)](https://puzzling-ironclad-999.notion.site/7ce0e0d610dd4313b15389c07a7d78f5)

---

Welcome to the "Data Web" project! You will transfer data from various arachnological publications into digital format: open a publication file, find the information there, and enter it into the form on the website. Recognize and structure information about spider finds from the provided scientific articles: who, where, when, and who found it?

**Technical requirements for project participation:**

- Internet access
- Telegram messenger
- Personal computer / laptop
- Desktop browser (Google Chrome, Firefox, Edge, Safari, Opera)

> Correct operation on tablets and phones is not guaranteed!

# Registration and Authorization

## Registration via Telegram

To register, go to the authorization page and click the **Login via Telegram** button. The system will generate a one-time code and display a QR code. Scan it with your phone or follow the link to the bot and send the code.

![Registration via Telegram](/assets/instruction/auth1.webp)

After confirming the code in Telegram, you will be redirected to the profile page. Fill in all required fields: name, username, password, age, sex, languages, and work preferences.

![Profile after registration](/assets/instruction/auth2.webp)

## Login

For future logins, use the username and password you specified during registration. The authorization token is updated automatically — no need to log in again.

![Login page](/assets/instruction/auth3.webp)

# Dashboard — Publications List

After logging in, you will be taken to the **Publications** page (dashboard). This page displays publications assigned to you for processing.

Publications are divided into two groups:

- **Available for processing** — publications that you can start or continue.
- **In queue** — publications that are already being processed by other volunteers.

Each publication has two buttons:

- **Continue** — go to the data entry form.
- **Finish processing** — go to the completion page (see "Finishing publication processing" section).

![Publications dashboard](/assets/instruction/dashboard1.webp)

You can read more about the structure of scientific publications [here](https://puzzling-ironclad-999.notion.site/bf56cef08da44bd9a8465fbd2b58f5df).

# Getting Started — Data Entry Form

Click **Continue** on the desired publication. The data entry form will open, consisting of two parts: **sidebar** on the left and **form cards** on the right.

![General form view](/assets/instruction/form1.webp)

### General Recommendations for Working with Publications

1. **First, read the publication in its entirety.** As our experience shows, reading the publication beforehand will answer most questions about where to find information about the collection site, collection methods, etc.
2. Within the project, we enter information about **FINDS** of spiders into the form. One find is one species found on one date in one place and collected using one method. The number of individuals of this species can be any. If the same species is collected on different dates, in different places, or using different methods — that is, if there are any differences — these are **DIFFERENT FINDS**. Each of them will need to be entered into the form separately.
3. If you have any questions, don't hesitate to contact us for help. You can write to the support chat (the **Support** button in the site header) or contact the Telegram bot with the `/support` command.

# Sidebar

The sidebar is a list of all records (finds) in the current publication. It is located to the left of the form and is always visible on screen.

![Sidebar](/assets/instruction/sidebar1.webp)

## Managing Records

- **Add record** — button at the top of the sidebar. Creates a new empty record.
- **Switching between records** — click on any record in the sidebar to open it for editing.
- **Delete record** — button with a trash icon on each record. Confirm deletion in the popup window.

## Record Status

Each record has a status displayed with a colored indicator:

| Status | Color | Meaning |
|--------|------|---------|
| Empty | Gray | Record is not filled |
| Draft | Blue | Record is filled but not submitted |
| Error | Red | Validation errors present |
| Ready | Green | Record successfully submitted |

The currently edited record is highlighted with a blue dot and "Editing" label.

![Record statuses](/assets/instruction/sidebar2.webp)

## Working with Excel

The sidebar has a **Working with Excel** button that allows:

- **Import** — load records from a `.xlsx` or `.csv` file (Drag & Drop or file selection). When importing, current records will be replaced.
- **Export** — download all your records for the current publication in `.xlsx` format.

![Excel Import/Export](/assets/instruction/excel1.webp)

# Auto-save

The system automatically saves your work. After each field change, the record is saved as a draft after 2 seconds.

The auto-save indicator is located at the bottom of the form:

- **Saving...** — saving in progress.
- **Saved at HH:MM:SS** — record successfully saved.
- **Not saved** — a saving problem occurred.

![Auto-save](/assets/instruction/autosave1.webp)

> Auto-save works for drafts. To submit a record to the database as complete, click the **Submit** button at the bottom of the form.

When switching between records, the current record is automatically saved before loading the next one.

# Spatial Localization

The **Spatial Localization** card is where you enter all information about the find location: administrative division, toponym, and geographic coordinates.

![Spatial localization card](/assets/instruction/geo_card1.webp)

## Coordinate Source

First, select the coordinate source:

- **From Source (Original)** — coordinates are provided directly in the publication. In this case, select the input format (DD, DM, or DMS) and enter the coordinates.
- **Own Georeference (Volunteer)** — you determined the coordinates yourself (e.g., by locating the site on a map). You can select a point on the interactive map.
- **No Coordinates** — the publication does not contain coordinates and you cannot determine them. A warning will appear during verification — click "Yes, that's correct."

## Administrative Data

**Country** — Russia is set by default. If the publication is in English, uncheck the "Location relates to Urals" checkbox and enter the country name manually in English.

**Region (subject)** — oblast, republic, or krai. The form offers only those districts that belong to the selected region.

**District** — smaller administrative units. If you select a district first, the region will be set automatically.

> If you cannot find the required option in the list, or want to enter all finds from this publication, not just those related to the Urals, uncheck *Location relates to Urals* and then enter any other administrative names.

**Locality (toponym)** — enter manually exactly as it is specified in the work. Most often this is the nearest settlement to where the find was made, but it could be nature reserve names, direction indications (4 km south of village Makarovo), and other variants.

![Urals map](/assets/instruction/adm.webp)

## Coordinates

If you selected "From Source," specify the coordinate input format:

- **DD** — decimal degrees (e.g., 55.7558, 37.6173)
- **DM** — degrees and minutes (e.g., 55°45.35' N, 37°37.04' E)
- **DMS** — degrees, minutes, seconds

![Coordinate formats](/assets/instruction/geo.webp)

Enter the coordinates in the corresponding fields. The **Uncertainty, m** field is the distance in meters within which the locality is located (usually 30 m for modern GPS). If the value is unknown, leave the field empty.

![Coordinate input](/assets/instruction/geo3.webp)

If the coordinates are provided directly in the publication, indicate this in the **Geographical Notes**.

![Geographical notes](/assets/instruction/geo2.webp)

## Own Georeference

If you selected "Own Georeference (Volunteer)," an interactive map will open. Click on the map to place a point. The coordinates will be set automatically.

![Interactive map](/assets/instruction/map1.webp)

> At the current stage of the project, we do not engage in own georeferencing, so we only have two options: either enter coordinates from the publication or not enter them. If you want to work on finding coordinates, contact us for individual instructions.

## Presets (Data Copying)

In the upper right corner of the card there is a dropdown list **Fill from Another Record**. If the current publication already has other records with coordinate or location data, you can select one of them — all corresponding fields will be filled automatically.

![Localization presets](/assets/instruction/preset1.webp)

## Example Entry

Since the publication is in English, uncheck *Enter administrative names in Russian*. The location is always specified in the "Materials and Methods" section of the publication. In this article, information about the Region is also reflected in the publication title. Therefore, select Orenburg Oblast as the region, after changing the country to its English name (Russia).

![Region input](/assets/instruction/adm2.webp)

In this example, the specific collection sites are listed in the "Introduction" section. Later in the article text, references to the corresponding localities are given as numbers in square brackets.

![Finding localities](/assets/instruction/adm3.webp)

If we correlate these numbers with those given in the introduction, it turns out that both the first and second finds belong to Kuwandyk district. Enter the collection site manually as it is specified in the article.

![Completed block](/assets/instruction/adm4.webp)

# Collection Parameters

The **Collection Parameters** card is where you enter information about the date, method, and circumstances of collection.

![Collection parameters card](/assets/instruction/event_card1.webp)

## Collection Date

In the **Collection Date (as in article)** field, enter the date exactly as it is specified in the publication. Examples: "19.08.2018", "19.08–02.09.2018", "summer 2017", "VIII.2019".

If the date is a range, check the **Date is Interval** checkbox.

![Date input](/assets/instruction/eve1.webp)

**Date Precision** — day, week, month, or year. If the publication does not specify a specific day, select the appropriate precision.

## Collector

**Collector** — the person who collected the spider. If the article lists initials (e.g., TTK), look for their full form in the text (Tuneva T.K.) and enter the complete information. If collectors are not indicated, enter the publication authors.

## Collection Method

**Collection Method** — the way the spider was caught (Barber traps, sweep netting, hand collection, etc.).

## Sample Size

**Sample Size** and **Sample Unit** — the researcher's effort spent on catching spiders. For example: size = 100, unit = trap-days. Or: size = 200, unit = sweep-net swings.

## Habitat

**Habitat** is a small area of territory with homogeneous natural conditions, usually distinguished by dominant plants (e.g., birch forest, floodplain meadow). Enter as complete information as possible about the site into the form.

![Habitat example 1](/assets/instruction/image25.webp)
![Habitat example 2](/assets/instruction/image26.webp)

If there are multiple habitats, separate them with a semicolon ";". Sometimes instead of a brief name, detailed descriptions are provided — copy them into **Event Notes**.

## Notes

In **Event Notes**, you should write the method by which the material was collected (if specified in the publication), as well as any other useful information (weather conditions, terrain features, etc.).

![Completed block example](/assets/instruction/eve4.webp)

## Presets

Similar to the localization block, the upper right corner of the card has a dropdown list for copying collection parameter data from another record in the current publication.

> All information should be entered in the language of the original publication!

# Taxonomic Affiliation

In the **Taxonomy** card, we enter the Latin names of the spider family, genus, and species.

We are dealing with the order Araneae (or Aranei). Orders are divided into families, which end in *-idae* (e.g., Araneidae, Lycosidae). Families are divided into genera, and genera into species. A full species name looks, for example, like this: *Araneus diadematus Clerck, 1757*. The author's surname and year of description should not be entered anywhere.

![Taxonomy in article](/assets/instruction/tax1.webp)

## Form Fields

- **Family (Familia)** — start typing the name, suggestions will appear. Suggestions are loaded from the server.
- **Genus** — genus name. Suggestions appear based on the selected family.
- **Species epithet** — only the epithet, without the genus. Suggestions appear based on the family and genus.

![Dropdown list](/assets/instruction/tax2.webp)

Cascading suggestions work automatically: first select a family, then a genus (the list is filtered by family), then a species (the list is filtered by genus).

## If Species Not Found in List

If the desired species is not found in the dropdown list, check the **Latin Name Entered Manually** and enter the name manually. This may happen if the species has been renamed since the publication was released.

![Manual entry](/assets/instruction/tax3.webp)

## Additional Fields

- **Taxon Rank** — genus, species, or subspecies.
- **Type Status** — holotype, paratype, etc. (specified only if the species is described as new).
- **Valid Name** — if the name given in the article is outdated, enter the current name.
- **Taxonomic Notes** — notes on the entire taxon.
- **Identification Notes** — notes on the identification.

In some works, the genus may be abbreviated to a single letter. Enter the full genus and species in the form, without abbreviations.

If only the genus could be determined (indicated as *sp.*), leave the species epithet field empty and uncheck **Species Identified**.

# Quantitative Characteristics

In the **Quantitative Characteristics** card, data on the number of spiders is entered with consideration of their sex and age.

![Quantitative characteristics card](/assets/instruction/quantity_card1.webp)

## Input Fields

| Field | Description |
|-------|-------------|
| **Males** | Sexually mature males (♂, m) |
| **Subadult Males** | Young males, will become adults after the next molt (sub.♂, sub. m) |
| **Females** | Sexually mature females (♀, f) |
| **Subadult Females** | Young females (sub.♀, sub. f) |
| **Adults (Sex Unknown)** | Sexually mature individuals, sex not specified |
| **Juveniles** | Immature individuals (juv.) |

The **automatic total count** of individuals in the record is displayed to the right of the fields.

## Input Rules

Enter the number as is. If the number of spiders is given without specifying sex, record all individuals as **Adults (Sex Unknown)**. If males and females are given — enter them separately, **do not sum them**!

The number of specimens may not be specified (e.g., only a plus sign in a table). By default, enter 1 for the count and write in **Specimen Notes**: "presence of individuals, not their quantity."

## Measurement Units

If not the number of individuals but a different abundance indicator is specified, select the appropriate measurement units:

- individuals
- individuals per 10 trap-days
- individuals per 100 trap-days
- individuals per m²
- abundance score (according to Pesenko)
- individuals per 10/20/100 sweep-net swings
- individuals per 10 pitfall-trap days
- individuals per 100 traps

Sometimes multiple indicators are given in a publication. We need to choose one. Catch per 100 trap-days takes priority over %, and actual individual count takes priority over trap-days. Enter the more significant indicator in the form, and write the less significant one in **Specimen Notes**.

![Quantity input](/assets/instruction/tax4.webp)

# Checking and Submitting a Record

When all form fields are filled, check the record status in the sidebar:

- **Green indicator (Ready)** — record passed validation and was successfully submitted.
- **Blue indicator (Draft)** — record was saved automatically but not submitted. Click the **Submit** button at the bottom of the form.
- **Red indicator (Error)** — validation errors present. Fix the marked fields.

![Status indicator at bottom of form](/assets/instruction/footer1.webp)

The **Submit** button is located in the bottom panel of the form. It is only available when the form is filled. When clicked, the record undergoes server validation and, if no errors, is saved to the database.

If there are errors, the system will highlight the problematic fields. Just return to them and fix them — you won't need to re-enter everything.

![Validation errors](/assets/instruction/error1.webp)

# Finishing Publication Processing

When you believe you have extracted all possible data from the publication, go to the completion page. This can be done in two ways:

1. The **Finish processing** button in the sidebar (at the bottom of the records list).
2. The **Finish processing** button on the dashboard.

![Finish button in sidebar](/assets/instruction/sidebar_finish1.webp)

## Completion Page

On the completion page, fill in the form with the final information about the publication:

![Completion page](/assets/instruction/submit1.webp)

### Processing Level

Select one of the options:

- **Full** — all species identified to species level.
- **Ural** — processing limited to the Urals.
- **Partial** — some species not identified.
- **Skip** — publication skipped.

### Finds Outside the Urals

Indicate whether the publication contains finds outside the Urals (Yes / No).

### Species Without Material

Indicate whether the publication contains species mentioned without material (Yes / No).

### Comment

A free field for any comments about the publication (maximum 1000 characters). If the publication had specific features (species outside the Urals, lists of species without finds), it's worth writing about it. This information will greatly facilitate further work with the data.

Click **Finish** to submit. The publication will be considered fully processed, and the system will offer you a new one.

> If you left no records, the system will warn you and request confirmation.

# Additional Features

## Presets (Copying Between Records)

Presets allow you to copy data from one record to another. Available for two blocks:

- **Spatial Localization** — copies country, region, district, locality, coordinates, etc.
- **Collection Parameters** — copies date, collector, collection method, habitat, etc.

The **Fill from Another Record** dropdown is located in the upper right corner of each card. Select the source record — and the data will be inserted automatically.

This significantly speeds up work when entering many finds from the same publication with identical parameters.

## Statistics

On the **Statistics** page you can view:

- General project statistics (number of processed publications, species, volunteers).
- Personal statistics: number of records entered, processed publications, unique species and families.
- Time dynamics charts.

Search for other users' statistics is also available.

![Statistics page](/assets/instruction/stat1.webp)

## Settings

On the **Settings** page you can change your display name, password, language, region, work preferences, and other profile parameters.

![Settings page](/assets/instruction/settings1.webp)

## Support

If you have questions or problems, use the **Support** button in the site header. You will be taken to a page with instructions on how to contact technical support via the Telegram bot.

---

**Thank you for your contribution to our cause! We really appreciate it!** If you have any questions — write to our Telegram bot (`/support`), and we will respond promptly!