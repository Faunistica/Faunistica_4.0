#!/usr/bin/env python3
import json
import sys
import urllib.request

resp = urllib.request.urlopen("http://localhost:5001/health")
data = json.loads(resp.read())
if data["status"] != "ok":
    sys.exit(1)
