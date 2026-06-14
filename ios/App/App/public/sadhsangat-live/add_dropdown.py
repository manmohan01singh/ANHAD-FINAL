content = open('index.html', 'r', encoding='utf-8').read()
old = '''        Filter
      </button>
    </div>'''
new = '''        Filter
      </button>
      
      <div class="search-filter-dropdown" id="searchFilterDropdown" style="display:none; position:absolute; right:8px; top:50px; background:var(--card-bg); border:var(--card-border); border-radius:12px; padding:8px; box-shadow:var(--card-shadow); z-index:1000; min-width:180px;">
        <div class="filter-option" data-filter="all">All Results</div>
        <div class="filter-option" data-filter="channels">Channels Only</div>
        <div class="filter-option" data-filter="videos">Videos Only</div>
      </div>
    </div>'''
content = content.replace(old, new)
open('index.html', 'w', encoding='utf-8').write(content)
