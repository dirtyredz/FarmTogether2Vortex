[size=6][color=#F7D994]🚜  Farm Together 2 Support for Vortex[/color][/size]
[color=#C7A25B][i]Manage Farm Together 2 mods in Vortex. Plugins land where BepInEx looks for them.[/i][/color]
[color=#C7A25B]🎮 Steam  ·  🧩 BepInEx 6 IL2CPP  ·  📦 Three install rules  ·  🔓 Open source[/color]
[color=#7A6A9B]────────────────────────────────────────[/color]

[quote]🧹 [color=#F7D994][b]Clean in, clean out.[/b][/color] Everything this extension installs is an ordinary Vortex mod, so disabling or purging it in Vortex takes the files back out of your game folder.[/quote]

[size=5][color=#F7D994]🌾  What it does[/color][/size]
[color=#D4D4D8]Farm Together 2 mods are BepInEx 6 plugins, and until now the only way to install one was to unzip it by hand into the right folder and hope the archive was laid out the way you guessed.[/color]

[color=#D4D4D8]This extension teaches Vortex about the game. Vortex finds your Steam copy, you add mods the way you would for any other game, and each archive is looked at and sent to the right place: the BepInEx loader into the game folder, plugins into BepInEx\plugins.[/color]

[color=#D4D4D8]It does not change the game, your farm or your saves. It only decides where a mod's files go.[/color]

[size=5][color=#F7D994]✨  Main features[/color][/size]
[list]
[*][color=#D4D4D8]Farm Together 2 appears in Vortex's Games tab and is found automatically from your Steam library.[/color]
[*][color=#D4D4D8]BepInEx loader packs (the zip with doorstop_config.ini and winhttp.dll) install straight into the game folder, even when the zip wraps them in an extra folder.[/color]
[*][color=#D4D4D8]Mod archives that ship their own BepInEx folder install from BepInEx down, and stray readme files outside it are left out.[/color]
[*][color=#D4D4D8]Plain plugin archives (just the DLLs) install into BepInEx\plugins with their own folder layout kept.[/color]
[*][color=#D4D4D8]Anything it does not recognise falls through to Vortex's normal installer, so nothing is forced into the wrong place.[/color]
[*][color=#D4D4D8]Creates BepInEx\plugins for you the first time you manage the game.[/color]
[/list]

[size=5][color=#F7D994]📋  Requirements[/color][/size]
[list]
[*][color=#D4D4D8][url=https://www.nexusmods.com/site/mods/1]Vortex[/url] (the Nexus Mods mod manager).[/color]
[*][color=#D4D4D8]Farm Together 2 on Steam.[/color]
[*][color=#D4D4D8]For the game mods themselves: [url=https://builds.bepinex.dev/projects/bepinex_be]BepInEx 6 bleeding edge, Unity IL2CPP win-x64[/url]. Farm Together 2 is an IL2CPP game, so BepInEx 5 and the Mono builds of BepInEx 6 will not load. The extension does not download BepInEx for you.[/color]
[/list]

[size=5][color=#F7D994]📥  Installation[/color][/size]
[color=#D4D4D8][b]🟢 With Vortex[/b][/color]

[list=1]
[*][color=#D4D4D8]In Vortex, open Games, search for Farm Together 2 and click Manage. Vortex fetches this extension on its own.[/color]
[*][color=#D4D4D8]Download the BepInEx 6 IL2CPP win-x64 zip from the link above and drag it into Vortex's Mods tab. The extension recognises the loader pack and installs it into the game folder. Enable it and deploy.[/color]
[*][color=#D4D4D8]Start the game once so BepInEx can set itself up. The first start takes a minute longer than usual.[/color]
[*][color=#D4D4D8]Install Farm Together 2 mods the normal way, with Mod Manager Download or by dragging their archives in.[/color]
[/list]

[color=#D4D4D8][b]🔧 Manually[/b][/color]

[list=1]
[*][color=#D4D4D8]Download the main file from the Files tab.[/color]
[*][color=#D4D4D8]Extract it into a new folder named farmtogether2 under %APPDATA%\Vortex\plugins, so that info.json sits directly inside that folder.[/color]
[*][color=#D4D4D8]Restart Vortex. Farm Together 2 now appears under Games, and you can carry on from step 2 above.[/color]
[/list]

[size=5][color=#F7D994]🎛️  Configuration[/color][/size]
[color=#D4D4D8]There is nothing to configure. The extension has no settings of its own: it registers the game, two mod types (BepInEx in the game folder, and BepInEx plugin) and the install rules above. Each mod's own settings stay in that mod's config file under BepInEx\config.[/color]

[size=5][color=#F7D994]🤝  Compatibility[/color][/size]
[list]
[*][color=#D4D4D8]Works with any Farm Together 2 mod packaged as a BepInEx folder tree or as plain plugin DLLs.[/color]
[*][color=#D4D4D8]Vortex deploys with symlinks when your Vortex staging folder and the game sit on different drives. That is expected and works with BepInEx.[/color]
[*][color=#D4D4D8]It only knows the Steam release of the game.[/color]
[*][color=#D4D4D8]Bugs and suggestions are welcome on the Posts tab or the [url=https://github.com/dirtyredz/FarmTogether2Vortex]GitHub repository[/url].[/color]
[/list]

[size=5][color=#F7D994]💜  Shout outs[/color][/size]
[list]
[*][color=#D4D4D8]Milkstone Studios, for Farm Together 2 and a farm worth sharing.[/color]
[*][color=#D4D4D8]The BepInEx and HarmonyX teams, without whom none of this scene exists.[/color]
[*][color=#D4D4D8]The Nexus Mods Vortex team, whose Moonlight Peaks extension showed the shape this one follows.[/color]
[*][color=#D4D4D8]My Mate, for being my inspiration.[/color]
[/list]
