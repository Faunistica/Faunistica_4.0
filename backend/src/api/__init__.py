from fastapi import APIRouter

from api import (
    autofill_taxon,
    check_auth,
    del_record,
    edit_record,
    gen_stats,
    geo_search,
    get_localion,
    get_publ,
    get_record,
    get_records_file,
    logout,
    next_publ,
    pers_stats,
    publ_from_hash,
    records,
    refresh_token,
    suggest_taxon,
    support,
    user_image,
    users,
)

api_router = APIRouter()

api_router.include_router(users.router)
api_router.include_router(records.router)
api_router.include_router(gen_stats.router)
api_router.include_router(refresh_token.router)
api_router.include_router(check_auth.router)
api_router.include_router(logout.router)
api_router.include_router(suggest_taxon.router)
api_router.include_router(autofill_taxon.router)
api_router.include_router(get_publ.router)
api_router.include_router(support.router)
api_router.include_router(pers_stats.router)
api_router.include_router(user_image.router)
api_router.include_router(get_localion.router)
api_router.include_router(get_records_file.router)
api_router.include_router(get_record.router)
api_router.include_router(del_record.router)
api_router.include_router(edit_record.router)
api_router.include_router(next_publ.router)
api_router.include_router(publ_from_hash.router)
api_router.include_router(geo_search.router)
